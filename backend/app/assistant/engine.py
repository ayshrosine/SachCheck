"""Core assistant engine."""

from app.assistant.context import ApplicationContext
from app.assistant.planner import Planner
from app.assistant.registry import tool_registry


class AssistantEngine:
    """Orchestrate planning and tool execution."""

    def __init__(self) -> None:
        self._planner = Planner()

    async def process(self, message: str) -> str:
        """Plan and process an assistant message."""
        context = ApplicationContext.default()
        plan = await self._planner.plan(message)
        if plan is None:
            return "Jarvis initialized."
        result = await tool_registry.execute(
            plan.tool_name,
            context=context,
            **plan.parameters,
        )
        return result.message
