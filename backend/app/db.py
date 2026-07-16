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
        try:
            if not settings.supabase_url:
                print("No Supabase URL configured - running in database-less mode")
                self.pool = None
                return
                
            db_url = settings.supabase_url
            if db_url.startswith('https://'):
                db_url = db_url.replace('https://', 'postgresql://')
            self.pool = await asyncpg.create_pool(
                db_url,
                min_size=2,
                max_size=10,
                command_timeout=60
            )
            print("Database connected successfully")
        except Exception as e:
            print(f"Database connection failed: {e}")
            print("Continuing without database connection...")
            self.pool = None
    
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
        if not self.pool:
            # Return a mock record when database is not available
            import uuid
            from datetime import datetime
            return {
                "id": str(uuid.uuid4()),
                "device_id": device_id,
                "user_id": user_id,
                "modality": modality.value,
                "verdict": verdict.value,
                "confidence": confidence,
                "reasons": reasons,
                "modality_flags": modality_flags,
                "object_key": object_key,
                "created_at": datetime.utcnow()
            }
            
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
        if not self.pool:
            # Return empty list when database is not available
            return []
            
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
        if not self.pool:
            # Return a mock record when database is not available
            import uuid
            from datetime import datetime
            return {
                "id": str(uuid.uuid4()),
                "scan_id": scan_id,
                "was_verdict_correct": was_verdict_correct,
                "note": note,
                "created_at": datetime.utcnow()
            }
            
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