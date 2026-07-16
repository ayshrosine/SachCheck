import os
import uuid
import aiofiles
import tempfile
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Request
from app.model_router import model_router
from app.storage import storage
from app.db import db
from app.rate_limit import limiter
from app.schemas import VerdictResponse, ScanResponse, Modality, FeedbackCreate
from app.config import settings


router = APIRouter()


def _detect_modality(content_type: str) -> str:
    """Detect modality from content type"""
    if content_type.startswith("video/"):
        return "video"
    elif content_type.startswith("audio/"):
        return "audio"
    elif content_type.startswith("image/"):
        return "image"
    return None


async def _save_temp(file: UploadFile) -> str:
    """Save uploaded file to temporary location"""
    # Create temp file with appropriate extension
    suffix = f".{file.filename.split('.')[-1]}" if file.filename else ""
    temp_path = tempfile.mktemp(suffix=suffix)
    
    async with aiofiles.open(temp_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    return temp_path


@router.post("/scan", response_model=ScanResponse)
@limiter.limit("20/hour")
async def create_scan(
    request: Request,
    file: UploadFile = File(...),
    device_id: str = None
):
    """
    Create a new scan by uploading a media file for analysis
    Rate limited: 20 requests per hour per device/IP
    """
    # Generate device_id if not provided
    if not device_id:
        device_id = str(uuid.uuid4())
    
    # Detect modality
    modality_str = _detect_modality(file.content_type)
    if modality_str is None:
        raise HTTPException(
            status_code=415, 
            detail={
                "error": "unsupported_file_type",
                "message": "Unsupported file type. Please upload video, audio, or image files.",
                "supported_types": ["video/*", "audio/*", "image/*"]
            }
        )
    
    modality = Modality(modality_str)
    
    # Check file size (50MB max)
    if file.size and file.size > 50 * 1024 * 1024:
        raise HTTPException(
            status_code=413, 
            detail={
                "error": "file_too_large",
                "message": f"File size {file.size / (1024*1024):.2f}MB exceeds 50MB limit",
                "max_size_mb": 50
            }
        )
    
    # Save file temporarily
    local_path = await _save_temp(file)
    
    try:
        # Analyze with model router
        verdict_response: VerdictResponse = await model_router.analyze(
            local_path, modality_str, file.content_type
        )
        
        # Upload to R2
        object_key = storage.upload_file(local_path, modality_str)
        
        # Schedule deletion (48 hours)
        storage.schedule_deletion(object_key, hours=48)
        
        # Save to database
        scan_record = await db.save_scan(
            device_id=device_id,
            modality=modality,
            verdict=verdict_response.verdict,
            confidence=verdict_response.confidence,
            reasons=verdict_response.reasons,
            modality_flags=verdict_response.modality_flags.dict() if verdict_response.modality_flags else None,
            object_key=object_key
        )
        
        # Enhance response with additional metadata
        scan_record["model_used"] = verdict_response.model_used
        scan_record["processing_time_ms"] = verdict_response.processing_time_ms
        
        # Update object_key to be None if storage is not configured
        if not storage.enabled:
            scan_record["object_key"] = None
        
        return ScanResponse(**scan_record)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Analysis error: {e}")
        raise HTTPException(
            status_code=503, 
            detail={
                "error": "analysis_failed",
                "message": "Analysis service temporarily unavailable",
                "suggestion": "Please try again in a few moments",
                "debug_info": str(e) if settings.environment == "development" else None
            }
        )
    finally:
        # Clean up temp file
        if os.path.exists(local_path):
            os.remove(local_path)


@router.get("/scans", response_model=list[ScanResponse])
async def list_scans(device_id: str):
    """Get recent scans for a device"""
    scans = await db.get_recent_scans(device_id)
    return [ScanResponse(**scan) for scan in scans]


@router.post("/feedback")
async def submit_feedback(feedback: FeedbackCreate):
    """Submit user feedback on a verdict"""
    try:
        result = await db.save_feedback(
            feedback.scan_id,
            feedback.was_verdict_correct,
            feedback.note
        )
        return {"status": "success", "feedback": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save feedback: {str(e)}")


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "scan"}