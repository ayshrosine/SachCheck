import os
import time
import json
import asyncio
from typing import Optional, Dict, Any
from google import generativeai as genai
import requests
from app.config import settings
from app.schemas import VerdictResponse, Verdict, ModalityFlags


class ModelRouter:
    def __init__(self):
        # Configure Google AI Studio
        genai.configure(api_key=settings.google_ai_studio_api_key)
        self.primary_model = genai.GenerativeModel(settings.gemma_model_id)
        self.ollama_base_url = settings.ollama_base_url
        self.system_prompt = self._load_system_prompt()
    
    def _load_system_prompt(self) -> str:
        """Load the system prompt from file"""
        prompt_path = os.path.join(os.path.dirname(__file__), "prompts", "system_prompt.txt")
        with open(prompt_path, "r") as f:
            return f.read()
    
    def _parse_verdict(self, response_text: str, model_used: str, processing_time_ms: int) -> VerdictResponse:
        """Parse the model response into a structured VerdictResponse"""
        try:
            # Try to extract JSON from the response
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            data = json.loads(response_text)
            
            # Convert string verdict to enum
            verdict_map = {
                "likely_real": Verdict.LIKELY_REAL,
                "suspicious": Verdict.SUSPICIOUS,
                "likely_fake": Verdict.LIKELY_FAKE,
                "inconclusive": Verdict.INCONCLUSIVE
            }
            
            verdict = verdict_map.get(data.get("verdict", "inconclusive"), Verdict.INCONCLUSIVE)
            
            # Parse modality flags if present
            modality_flags = None
            if "modality_flags" in data and data["modality_flags"]:
                modality_flags = ModalityFlags(**data["modality_flags"])
            
            return VerdictResponse(
                verdict=verdict,
                confidence=data.get("confidence", 50),
                reasons=data.get("reasons", []),
                modality_flags=modality_flags,
                model_used=model_used,
                processing_time_ms=processing_time_ms
            )
        except Exception as e:
            print(f"Error parsing model response: {e}")
            # Return a fallback inconclusive response
            return VerdictResponse(
                verdict=Verdict.INCONCLUSIVE,
                confidence=0,
                reasons=["Error parsing model response", str(e)],
                model_used=model_used,
                processing_time_ms=processing_time_ms
            )
    
    async def _analyze_with_cloud(self, file_path: str, modality: str) -> Optional[VerdictResponse]:
        """Analyze using Google AI Studio API (primary)"""
        try:
            start_time = time.time()
            
            # Read file based on modality
            if modality == "image":
                with open(file_path, "rb") as f:
                    image_data = f.read()
                content = [
                    {"text": self.system_prompt},
                    {"inline_data": {"mime_type": "image/jpeg", "data": image_data}}
                ]
            elif modality == "audio":
                with open(file_path, "rb") as f:
                    audio_data = f.read()
                content = [
                    {"text": self.system_prompt},
                    {"inline_data": {"mime_type": "audio/wav", "data": audio_data}}
                ]
            elif modality == "video":
                # For video, we'll send it as a file
                with open(file_path, "rb") as f:
                    video_data = f.read()
                content = [
                    {"text": self.system_prompt},
                    {"inline_data": {"mime_type": "video/mp4", "data": video_data}}
                ]
            else:
                return None
            
            response = self.primary_model.generate_content(content)
            processing_time_ms = int((time.time() - start_time) * 1000)
            
            if response and response.text:
                return self._parse_verdict(response.text, "google_ai_studio", processing_time_ms)
            
        except Exception as e:
            print(f"Cloud API error: {e}")
            raise  # Re-raise to trigger fallback
        return None
    
    async def _analyze_with_ollama(self, file_path: str, modality: str) -> Optional[VerdictResponse]:
        """Analyze using local Ollama fallback (image/text only for now)"""
        try:
            if modality == "audio":
                # Audio not stable in Ollama yet - return None to trigger error
                return None
            
            start_time = time.time()
            
            # For image, use the vision-capable model
            if modality == "image":
                import base64
                with open(file_path, "rb") as f:
                    image_data = f.read()
                
                payload = {
                    "model": "gemma4:e4b",
                    "prompt": self.system_prompt,
                    "images": [base64.b64encode(image_data).decode('utf-8')]
                }
            else:
                # Text-only fallback
                payload = {
                    "model": "gemma4:e4b",
                    "prompt": f"{self.system_prompt}\n\nAnalyze this media."
                }
            
            response = requests.post(
                f"{self.ollama_base_url}/api/generate",
                json=payload,
                timeout=60
            )
            
            processing_time_ms = int((time.time() - start_time) * 1000)
            
            if response.status_code == 200:
                response_text = response.json().get("response", "")
                return self._parse_verdict(response_text, "ollama_fallback", processing_time_ms)
            
        except Exception as e:
            print(f"Ollama error: {e}")
        return None
    
    async def analyze(self, file_path: str, modality: str, content_type: str) -> VerdictResponse:
        """
        Main analysis method with retry and fallback logic
        Tries cloud API first, then falls back to local Ollama
        """
        # Try cloud API first with one retry
        for attempt in range(2):
            try:
                result = await self._analyze_with_cloud(file_path, modality)
                if result:
                    return result
            except Exception as e:
                print(f"Cloud API attempt {attempt + 1} failed: {e}")
                if attempt == 0:
                    await asyncio.sleep(1)  # Brief backoff before retry
                continue
        
        # Cloud failed, try Ollama fallback
        print("Cloud API failed, trying Ollama fallback...")
        try:
            result = await self._analyze_with_ollama(file_path, modality)
            if result:
                return result
        except Exception as e:
            print(f"Ollama fallback also failed: {e}")
        
        # Everything failed - return inconclusive with error info
        if modality == "audio":
            # Be honest about audio limitations
            return VerdictResponse(
                verdict=Verdict.INCONCLUSIVE,
                confidence=0,
                reasons=["Audio analysis temporarily unavailable - cloud API is required for this modality"],
                model_used="none",
                processing_time_ms=0
            )
        else:
            return VerdictResponse(
                verdict=Verdict.INCONCLUSIVE,
                confidence=0,
                reasons=["Analysis service temporarily unavailable", "Please try again in a few moments"],
                model_used="none",
                processing_time_ms=0
            )


# Global model router instance
model_router = ModelRouter()