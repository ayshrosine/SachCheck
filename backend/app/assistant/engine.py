"""Core assistant engine."""

from app.assistant.context import ApplicationContext
from app.assistant.executor import ExecutionEngine
from app.assistant.planner import Planner


class AssistantEngine:
    """Orchestrate planning and tool execution."""

    def __init__(self) -> None:
        self._planner = Planner()
        self._executor = ExecutionEngine()

    async def process(self, message: str) -> str:
        """Plan and process an assistant message."""
        context = ApplicationContext.default()
        plan = await self._planner.plan(message)
        if plan is None:
            return "Jarvis initialized."
        result = await self._executor.execute(plan, context)
        return result.message
