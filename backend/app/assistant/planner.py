"""Execution planning for assistant requests."""

from dataclasses import dataclass, field
from typing import Any
from uuid import uuid4


@dataclass(frozen=True, slots=True)
class ExecutionStep:
    """A single tool execution within a plan."""

    tool_name: str
    parameters: dict[str, Any] = field(default_factory=dict)
    step_id: str = field(default_factory=lambda: str(uuid4()))
    description: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True, slots=True)
class Plan:
    """An execution plan selected by the planner."""

    steps: tuple[ExecutionStep, ...]
    plan_id: str = field(default_factory=lambda: str(uuid4()))
    description: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


class Planner:
    """Translate supported messages into execution plans."""

    async def plan(self, message: str) -> Plan | None:
        """Create a plan for an exact supported message."""
        if message == "health":
            return Plan(steps=(ExecutionStep(tool_name="health_check"),))
        if message == "history":
            return Plan(steps=(ExecutionStep(tool_name="get_history"),))
        return None
