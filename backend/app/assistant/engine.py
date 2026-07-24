"""Core assistant engine."""

from app.assistant.registry import tool_registry


class AssistantEngine:
    """Process messages sent to the assistant."""

    async def process(self, message: str) -> str:
        """Process a supported assistant message."""
        if message == "health":
            return await tool_registry.execute("health_check")
        return "Jarvis initialized."
