"""Reusable scan history retrieval."""

from app.db import db
from app.schemas import ScanResponse


class HistoryService:
    """Retrieve scan history through the database layer."""

    async def get_recent_scans(
        self,
        *,
        device_id: str,
        limit: int = 20,
    ) -> list[ScanResponse]:
        """Return recent scans for a device."""
        scans = await db.get_recent_scans(device_id, limit=limit)
        return [ScanResponse(**scan) for scan in scans]


history_service = HistoryService()
