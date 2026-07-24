"""Execution of assistant plans."""

from app.assistant.context import ApplicationContext
from app.assistant.planner import Plan
from app.assistant.registry import tool_registry
from app.assistant.types import ToolResult


class ExecutionEngine:
    """Execute plan steps sequentially through the tool registry."""

    async def execute(
        self,
        plan: Plan,
        context: ApplicationContext,
    ) -> ToolResult:
        """Execute a plan without modifying it."""
        if not plan.steps:
            raise ValueError("Execution plans must contain at least one step.")

        result: ToolResult | None = None
        for step in plan.steps:
            result = await tool_registry.execute(
                step.tool_name,
                context=context,
                **step.parameters,
            )
            if not result.success:
                return result

        if result is None:
            raise RuntimeError("Execution completed without a tool result.")
        return result
