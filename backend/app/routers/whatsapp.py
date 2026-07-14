from fastapi import APIRouter, Request, HTTPException
from typing import Dict, Any
import tempfile
import os
import aiofiles
from app.model_router import model_router
from app.storage import storage
from app.db import db


router = APIRouter()


@router.post("/whatsapp/webhook")
async def whatsapp_webhook(request: Request):
    """
    Webhook endpoint for WhatsApp Cloud API
    Receives incoming media messages and replies with analysis
    """
    # Verify webhook (for WhatsApp setup)
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")
    
    if mode == "subscribe" and token:
        # Verify token (should match what you set in WhatsApp dashboard)
        if token == "your_verify_token_here":  # Replace with actual token
            return {"status": "verified", "challenge": challenge}
        else:
            raise HTTPException(status_code=403, detail="Invalid verification token")
    
    # Process incoming message
    try:
        data = await request.json()
        
        # Extract message details
        entry = data.get("entry", [{}])[0]
        changes = entry.get("changes", [{}])[0]
        value = changes.get("value", {})
        
        messages = value.get("messages", [])
        if not messages:
            return {"status": "no_messages"}
        
        message = messages[0]
        
        # Check if message has media
        if message.get("type") in ["image", "video", "audio"]:
            media_id = message[message["type"]]["id"]
            phone_number = message["from"]
            
            # Download media from WhatsApp
            media_url = await get_whatsapp_media_url(media_id)
            if media_url:
                # Download and process media
                modality = message["type"]
                temp_path = await download_whatsapp_media(media_url, modality)
                
                try:
                    # Analyze with model router
                    verdict_response = await model_router.analyze(temp_path, modality, f"{modality}/*")
                    
                    # Upload to R2
                    object_key = storage.upload_file(temp_path, modality)
                    storage.schedule_deletion(object_key, hours=48)
                    
                    # Save to database (use phone number as device_id for WhatsApp users)
                    await db.save_scan(
                        device_id=f"whatsapp:{phone_number}",
                        modality=modality,
                        verdict=verdict_response.verdict,
                        confidence=verdict_response.confidence,
                        reasons=verdict_response.reasons,
                        modality_flags=verdict_response.modality_flags.dict() if verdict_response.modality_flags else None,
                        object_key=object_key
                    )
                    
                    # Send reply to WhatsApp
                    await send_whatsapp_reply(phone_number, format_verdict_for_whatsapp(verdict_response))
                    
                finally:
                    # Clean up temp file
                    if os.path.exists(temp_path):
                        os.remove(temp_path)
        
        return {"status": "processed"}
        
    except Exception as e:
        print(f"WhatsApp webhook error: {e}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")


async def get_whatsapp_media_url(media_id: str) -> str:
    """Get media URL from WhatsApp API"""
    # This would use the WhatsApp Cloud API to get the media URL
    # Requires WhatsApp API credentials and access token
    # Placeholder implementation
    return None


async def download_whatsapp_media(url: str, modality: str) -> str:
    """Download media from WhatsApp URL"""
    # This would download the media file using the URL
    # Placeholder implementation
    suffix = f".{modality}" if modality else ""
    return tempfile.mktemp(suffix=suffix)


async def send_whatsapp_reply(phone_number: str, message: str):
    """Send reply message via WhatsApp API"""
    # This would send the formatted verdict back to the user
    # Requires WhatsApp API credentials and access token
    # Placeholder implementation
    pass


def format_verdict_for_whatsapp(verdict_response) -> str:
    """Format the verdict for WhatsApp message"""
    verdict_emoji = {
        "likely_real": "✅",
        "suspicious": "⚠️",
        "likely_fake": "🚨",
        "inconclusive": "❓"
    }
    
    emoji = verdict_emoji.get(verdict_response.verdict.value, "❓")
    
    message = f"{emoji} *SachCheck Analysis*\n\n"
    message += f"*Verdict:* {verdict_response.verdict.value.replace('_', ' ').title()}\n"
    message += f"*Confidence:* {verdict_response.confidence}%\n\n"
    message += "*Reasons:*\n"
    for reason in verdict_response.reasons:
        message += f"• {reason}\n"
    
    return message