from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
import httpx


router = APIRouter()


class LoginRequest(BaseModel):
    email: EmailStr


class RegisterRequest(BaseModel):
    email: EmailStr
    device_id: str


class AuthResponse(BaseModel):
    success: bool
    message: str
    user_id: Optional[str] = None
    access_token: Optional[str] = None


@router.post("/auth/magic-link", response_model=AuthResponse)
async def send_magic_link(request: LoginRequest):
    """
    Send a magic link for email-based authentication
    Note: This integrates with Supabase Auth
    """
    # This would integrate with Supabase Auth's magic link functionality
    # For now, return a placeholder response
    return AuthResponse(
        success=True,
        message="Magic link sent to email (integration with Supabase Auth pending)",
        user_id=None,
        access_token=None
    )


@router.post("/auth/register", response_model=AuthResponse)
async def register_device(request: RegisterRequest):
    """
    Register a device with an optional email account
    This allows cross-device history sync
    """
    # This would integrate with Supabase Auth
    # For now, return a placeholder response
    return AuthResponse(
        success=True,
        message="Device registered (integration with Supabase Auth pending)",
        user_id=None,
        access_token=None
    )


@router.get("/auth/status")
async def auth_status():
    """Check authentication status"""
    return {
        "authenticated": False,
        "message": "Authentication integration pending Supabase setup"
    }