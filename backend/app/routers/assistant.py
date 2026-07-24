"""Assistant API routes."""

from fastapi import APIRouter

from app.assistant.engine import AssistantEngine
from app.assistant.types import AssistantChatRequest, AssistantChatResponse


router = APIRouter(prefix="/assistant")
engine = AssistantEngine()


@router.post("/chat", response_model=AssistantChatResponse)
async def chat(request: AssistantChatRequest) -> AssistantChatResponse:
    """Process a message through the assistant engine."""
    response = await engine.process(request.message)
    return AssistantChatResponse(success=True, response=response)
