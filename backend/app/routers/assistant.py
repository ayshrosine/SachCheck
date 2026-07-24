"""Assistant API routes."""

from fastapi import APIRouter

from app.assistant.engine import AssistantEngine
from app.assistant.types import AssistantChatRequest, AssistantChatResponse


router = APIRouter(prefix="/assistant")
engine = AssistantEngine()


@router.post(
    "/chat",
    response_model=AssistantChatResponse,
    response_model_exclude_none=True,
)
async def chat(request: AssistantChatRequest) -> AssistantChatResponse:
    """Process a message through the assistant engine."""
    return await engine.process(
        request.message,
        clarification_id=request.clarification_id,
    )
