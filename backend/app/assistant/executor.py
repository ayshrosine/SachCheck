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
        step = plan.steps[0]
        return await tool_registry.execute(
            step.tool_name,
            context=context,
            **step.parameters,
        )
