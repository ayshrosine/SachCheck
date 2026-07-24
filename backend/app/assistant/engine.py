"""Core assistant engine."""

from app.assistant.context import ApplicationContext
from app.assistant.executor import ExecutionEngine
from app.assistant.planner import Planner
from app.assistant.types import AssistantChatResponse


class AssistantEngine:
    """Orchestrate planning and tool execution."""

    def __init__(self) -> None:
        self._planner = Planner()
        self._executor = ExecutionEngine()

    async def process(self, message: str) -> AssistantChatResponse:
        """Plan and process an assistant message."""
        context = ApplicationContext.default()
        plan = await self._planner.plan(message)
        if plan is None:
            return AssistantChatResponse(
                success=True,
                response="Jarvis initialized.",
            )
        result = await self._executor.execute(plan, context)
        return AssistantChatResponse(
            success=result.success,
            response=result.message,
            action=result.action,
        )
