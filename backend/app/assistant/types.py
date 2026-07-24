"""Request and response models for the assistant API."""

from pydantic import BaseModel


class AssistantChatRequest(BaseModel):
    """A message sent to the assistant."""

    message: str


class AssistantChatResponse(BaseModel):
    """The assistant's response to a message."""

    success: bool
    response: str
