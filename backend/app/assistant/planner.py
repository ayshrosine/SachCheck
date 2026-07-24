"""Execution planning for assistant requests."""

from dataclasses import dataclass, field
from typing import Any
from uuid import uuid4


@dataclass(frozen=True, slots=True)
class Plan:
    """A tool execution selected by the planner."""

    tool_name: str
    parameters: dict[str, Any] = field(default_factory=dict)
    plan_id: str = field(default_factory=lambda: str(uuid4()))
    description: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


class Planner:
    """Translate supported messages into execution plans."""

    async def plan(self, message: str) -> Plan | None:
        """Create a plan for an exact supported message."""
        if message == "health":
            return Plan(tool_name="health_check")
        if message == "history":
            return Plan(tool_name="get_history")
        return None
