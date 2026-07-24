"""Reusable scan business workflow."""

import os
import tempfile
import uuid

import aiofiles
from fastapi import HTTPException, UploadFile

from app.config import settings
from app.db import db
from app.model_router import model_router
from app.schemas import Modality, ScanResponse, VerdictResponse
from app.storage import storage


class ScanService:
    """Analyze an uploaded media file and persist its scan result."""

    async def scan(
        self,
        *,
        file: UploadFile,
        device_id: str | None = None,
    ) -> ScanResponse:
        """Run the complete scan workflow for an uploaded file."""
        if not device_id:
            device_id = str(uuid.uuid4())

        modality_str = self._detect_modality(file.content_type)
        if modality_str is None:
            raise HTTPException(
                status_code=415,
                detail={
                    "error": "unsupported_file_type",
                    "message": (
                        "Unsupported file type. Please upload video, audio, or "
                        "image files."
                    ),
                    "supported_types": ["video/*", "audio/*", "image/*"],
                },
            )

        modality = Modality(modality_str)

        if file.size and file.size > 50 * 1024 * 1024:
            raise HTTPException(
                status_code=413,
                detail={
                    "error": "file_too_large",
                    "message": (
                        f"File size {file.size / (1024 * 1024):.2f}MB exceeds "
                        "50MB limit"
                    ),
                    "max_size_mb": 50,
                },
            )

        local_path = await self._save_temp(file)

        try:
            verdict_response: VerdictResponse = await model_router.analyze(
                local_path,
                modality_str,
                file.content_type,
            )

            object_key = storage.upload_file(local_path, modality_str)
            storage.schedule_deletion(object_key, hours=48)

            scan_record = await db.save_scan(
                device_id=device_id,
                modality=modality,
                verdict=verdict_response.verdict,
                confidence=verdict_response.confidence,
                reasons=verdict_response.reasons,
                modality_flags=(
                    verdict_response.modality_flags.dict()
                    if verdict_response.modality_flags
                    else None
                ),
                object_key=object_key,
            )

            scan_record["model_used"] = verdict_response.model_used
            scan_record["processing_time_ms"] = (
                verdict_response.processing_time_ms
            )

            if not storage.enabled:
                scan_record["object_key"] = None

            return ScanResponse(**scan_record)

        except HTTPException:
            raise
        except Exception as error:
            print(f"Analysis error: {error}")
            raise HTTPException(
                status_code=503,
                detail={
                    "error": "analysis_failed",
                    "message": "Analysis service temporarily unavailable",
                    "suggestion": "Please try again in a few moments",
                    "debug_info": (
                        str(error)
                        if settings.environment == "development"
                        else None
                    ),
                },
            )
        finally:
            if os.path.exists(local_path):
                os.remove(local_path)

    @staticmethod
    def _detect_modality(content_type: str) -> str | None:
        """Detect a media modality from its content type."""
        if content_type.startswith("video/"):
            return "video"
        if content_type.startswith("audio/"):
            return "audio"
        if content_type.startswith("image/"):
            return "image"
        return None

    @staticmethod
    async def _save_temp(file: UploadFile) -> str:
        """Save an uploaded file to a temporary location."""
        suffix = f".{file.filename.split('.')[-1]}" if file.filename else ""
        temp_path = tempfile.mktemp(suffix=suffix)

        async with aiofiles.open(temp_path, "wb") as temp_file:
            content = await file.read()
            await temp_file.write(content)

        return temp_path


scan_service = ScanService()
