import asyncpg
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.config import settings
from app.schemas import Verdict, Modality, ModalityFlags


class Database:
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
    
    async def connect(self):
        """Create connection pool to Supabase Postgres"""
        self.pool = await asyncpg.create_pool(
            settings.supabase_url.replace('https://', 'postgresql://'),
            min_size=2,
            max_size=10,
            command_timeout=60
        )
    
    async def disconnect(self):
        """Close connection pool"""
        if self.pool:
            await self.pool.close()
    
    async def save_scan(
        self,
        device_id: str,
        modality: Modality,
        verdict: Verdict,
        confidence: int,
        reasons: List[str],
        modality_flags: Optional[Dict[str, Any]] = None,
        object_key: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Save a scan record to the database"""
        async with self.pool.acquire() as conn:
            record = await conn.fetchrow(
                """
                INSERT INTO scans (device_id, user_id, modality, verdict, confidence, reasons, modality_flags, object_key)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id, device_id, user_id, modality, verdict, confidence, reasons, modality_flags, object_key, created_at
                """,
                device_id,
                user_id,
                modality.value,
                verdict.value,
                confidence,
                reasons,
                modality_flags,
                object_key
            )
            return dict(record)
    
    async def get_recent_scans(self, device_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Get recent scans for a device"""
        async with self.pool.acquire() as conn:
            records = await conn.fetch(
                """
                SELECT id, device_id, modality, verdict, confidence, reasons, modality_flags, created_at
                FROM scans
                WHERE device_id = $1
                ORDER BY created_at DESC
                LIMIT $2
                """,
                device_id,
                limit
            )
            return [dict(record) for record in records]
    
    async def save_feedback(self, scan_id: str, was_verdict_correct: bool, note: Optional[str] = None) -> Dict[str, Any]:
        """Save user feedback on a verdict"""
        async with self.pool.acquire() as conn:
            record = await conn.fetchrow(
                """
                INSERT INTO feedback (scan_id, was_verdict_correct, note)
                VALUES ($1, $2, $3)
                RETURNING id, scan_id, was_verdict_correct, note, created_at
                """,
                scan_id,
                was_verdict_correct,
                note
            )
            return dict(record)


# Global database instance
db = Database()