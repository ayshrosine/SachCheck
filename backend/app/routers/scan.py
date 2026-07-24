from fastapi import APIRouter, File, HTTPException, Request, UploadFile

from app.db import db
from app.rate_limit import limiter
from app.schemas import FeedbackCreate, ScanResponse
from app.services.scan_service import scan_service


router = APIRouter()


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
    return await scan_service.scan(file=file, device_id=device_id)


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
