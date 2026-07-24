"""Core assistant engine."""


class AssistantEngine:
    """Process messages sent to the assistant."""

    async def process(self, message: str) -> str:
        """Return the assistant's current initialization response."""
        return "Jarvis initialized."
