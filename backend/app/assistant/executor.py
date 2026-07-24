"""Execution of assistant plans."""

from app.assistant.context import ApplicationContext
from app.assistant.planner import Plan
from app.assistant.registry import tool_registry
from app.assistant.types import ToolResult


class ExecutionEngine:
    """Execute single-step plans through the tool registry."""

    async def execute(
        self,
        plan: Plan,
        context: ApplicationContext,
    ) -> ToolResult:
        """Execute a plan without modifying it."""
        return await tool_registry.execute(
            plan.tool_name,
            context=context,
            **plan.parameters,
        )
