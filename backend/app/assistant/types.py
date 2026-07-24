"""Request and response models for the assistant API."""

from typing import Any

from pydantic import BaseModel


class ToolResult(BaseModel):
    """The standardized result returned by an assistant tool."""

    success: bool
    message: str
    data: dict[str, Any] | None = None


class AssistantChatRequest(BaseModel):
    """A message sent to the assistant."""

    message: str


class AssistantChatResponse(BaseModel):
    """The assistant's response to a message."""

    success: bool
    response: str
