"""Request and response models for the assistant API."""

from typing import Any

from pydantic import BaseModel, Field


class AssistantAction(BaseModel):
    """A structured application action requested by the assistant."""

    type: str
    payload: dict[str, Any] = Field(default_factory=dict)


class ToolResult(BaseModel):
    """The standardized result returned by an assistant tool."""

    success: bool
    message: str
    data: dict[str, Any] | None = None
    action: AssistantAction | None = None


class AssistantChatRequest(BaseModel):
    """A message sent to the assistant."""

    message: str


class AssistantChatResponse(BaseModel):
    """The assistant's response to a message."""

    success: bool
    response: str
    action: AssistantAction | None = None
