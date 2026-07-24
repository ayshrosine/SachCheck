"""Execution planning for assistant requests."""

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any
from uuid import uuid4

from app.assistant.registry import tool_registry
from app.model_router import model_router


_FALLBACK_TOOLS = {
    "health": "health_check",
    "scan image": "scan_image",
    "scan video": "scan_video",
    "scan audio": "scan_audio",
    "history": "get_history",
}
_PROMPT = (
    Path(__file__).parent.parent / "prompts" / "planner_prompt.txt"
).read_text(encoding="utf-8")


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
        """Create a single-step plan for a user message."""
        prompt = self._build_prompt(message)

        try:
            response = await model_router.generate_text(prompt)
        except Exception:
            response = None

        if response is None:
            return self._fallback_plan(message)

        return self._parse_plan(response)

    @staticmethod
    def _build_prompt(message: str) -> str:
        tools = [
            {
                "name": tool.name,
                "description": tool.description,
            }
            for tool in tool_registry.list_tools()
        ]
        return (
            f"{_PROMPT}\n\n"
            f"Available tools:\n{json.dumps(tools)}\n\n"
            f"User message:\n{json.dumps(message)}"
        )

    @staticmethod
    def _parse_plan(response: str) -> Plan | None:
        try:
            payload = json.loads(response.strip())
        except (json.JSONDecodeError, TypeError):
            return None

        if not isinstance(payload, dict):
            return None

        tool_name = payload.get("tool_name")
        parameters = payload.get("parameters")
        if not isinstance(tool_name, str) or not isinstance(parameters, dict):
            return None

        registered_tools = {
            tool.name for tool in tool_registry.list_tools()
        }
        if tool_name not in registered_tools:
            return None

        return Plan(
            steps=(
                ExecutionStep(
                    tool_name=tool_name,
                    parameters=parameters,
                ),
            )
        )

    @staticmethod
    def _fallback_plan(message: str) -> Plan | None:
        tool_name = _FALLBACK_TOOLS.get(message)
        if tool_name is None:
            return None
        return Plan(steps=(ExecutionStep(tool_name=tool_name),))
