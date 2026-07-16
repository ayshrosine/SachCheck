from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class Modality(str, Enum):
    VIDEO = "video"
    AUDIO = "audio"
    IMAGE = "image"


class Verdict(str, Enum):
    LIKELY_REAL = "likely_real"
    SUSPICIOUS = "suspicious"
    LIKELY_FAKE = "likely_fake"
    INCONCLUSIVE = "inconclusive"


class ModalityFlags(BaseModel):
    """Per-modality analysis flags"""
    lip_sync_mismatch: Optional[bool] = None
    unnatural_blink_rate: Optional[bool] = None
    lighting_inconsistency: Optional[bool] = None
    tts_flatness: Optional[bool] = None
    urgency_language: Optional[bool] = None
    fake_authority: Optional[bool] = None
    payment_pressure: Optional[bool] = None


class VerdictResponse(BaseModel):
    """Structured verdict from the model"""
    verdict: Verdict
    confidence: int = Field(..., ge=0, le=100, description="Confidence score 0-100")
    reasons: List[str] = Field(default_factory=list, description="Plain-language explanations")
    modality_flags: Optional[ModalityFlags] = None
    model_used: str = Field(description="Which model path produced this verdict")
    processing_time_ms: int = Field(description="Time taken for analysis in milliseconds")
    
    model_config = {"protected_namespaces": ()}


class ScanCreate(BaseModel):
    """Request to create a new scan"""
    device_id: Optional[str] = None
    modality: Modality
    file_url: Optional[str] = None  # If file was uploaded separately


class ScanResponse(BaseModel):
    """Response after scan creation"""
    id: str
    device_id: str
    user_id: Optional[str] = None
    modality: Modality
    verdict: Verdict
    confidence: int
    reasons: List[str]
    modality_flags: Optional[Dict[str, Any]] = None
    object_key: Optional[str] = None
    created_at: datetime
    model_used: Optional[str] = None
    processing_time_ms: Optional[int] = None
    
    model_config = {"from_attributes": True, "protected_namespaces": ()}


class FeedbackCreate(BaseModel):
    """User feedback on a verdict"""
    scan_id: str
    was_verdict_correct: bool
    note: Optional[str] = None


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str
    timestamp: datetime