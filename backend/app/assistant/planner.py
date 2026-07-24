"""Execution planning for assistant requests."""

import json
from dataclasses import dataclass, field
from inspect import Parameter, signature
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
    "open privacy policy": "open_privacy_policy",
    "Open the privacy policy.": "open_privacy_policy",
    "close jarvis": "close_assistant",
    "Close Jarvis.": "close_assistant",
    "focus input": "focus_assistant_input",
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


@dataclass(frozen=True, slots=True)
class Clarification:
    """Information needed before a single tool can be executed."""

    tool_name: str
    parameters: dict[str, Any]
    missing_parameters: tuple[str, ...]
    question: str
    original_message: str


class Planner:
    """Translate supported messages into execution plans."""

    async def plan(
        self,
        message: str,
        clarification: Clarification | None = None,
    ) -> Plan | Clarification | None:
        """Create a single-step plan for a user message."""
        if clarification is not None:
            return await self._continue_plan(message, clarification)

        prompt = self._build_prompt(message)

        try:
            response = await model_router.generate_text(prompt)
        except Exception:
            response = None

        if response is None:
            return self._fallback_plan(message)

        return self._parse_plan(response, original_message=message)

    @classmethod
    def _build_prompt(cls, message: str) -> str:
        tools = [
            {
                "name": tool.name,
                "description": tool.description,
                "required_parameters": cls._required_parameters(tool.name),
            }
            for tool in tool_registry.list_tools()
        ]
        return (
            f"{_PROMPT}\n\n"
            f"Available tools:\n{json.dumps(tools)}\n\n"
            f"User message:\n{json.dumps(message)}"
        )

    @classmethod
    def _parse_plan(
        cls,
        response: str,
        *,
        original_message: str = "",
    ) -> Plan | Clarification | None:
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

        plan = Plan(
            steps=(
                ExecutionStep(
                    tool_name=tool_name,
                    parameters=parameters,
                ),
            )
        )
        question = cls._clarification_question(
            payload.get("clarification"),
            cls._missing_parameters(tool_name, parameters),
        )
        return cls._require_or_return_plan(
            plan,
            original_message=original_message,
            question=question,
        )

    @classmethod
    def _fallback_plan(
        cls,
        message: str,
    ) -> Plan | Clarification | None:
        tool_name = _FALLBACK_TOOLS.get(message)
        if tool_name is None:
            return None
        return cls._require_or_return_plan(
            Plan(steps=(ExecutionStep(tool_name=tool_name),)),
            original_message=message,
        )

    async def _continue_plan(
        self,
        message: str,
        clarification: Clarification,
    ) -> Plan | None:
        response: str | None
        try:
            response = await model_router.generate_text(
                self._build_continuation_prompt(message, clarification)
            )
        except Exception:
            response = None

        if response is not None:
            decision = self._parse_plan(
                response,
                original_message=clarification.original_message,
            )
            if isinstance(decision, Plan):
                step = decision.steps[0]
                tool_name = step.tool_name
                parameters = step.parameters
            elif isinstance(decision, Clarification):
                tool_name = decision.tool_name
                parameters = decision.parameters
            else:
                tool_name = None
                parameters = {}

            if tool_name == clarification.tool_name:
                merged_parameters = {
                    **clarification.parameters,
                    **parameters,
                }
                if not self._missing_parameters(
                    clarification.tool_name,
                    merged_parameters,
                ):
                    return Plan(
                        steps=(
                            ExecutionStep(
                                tool_name=clarification.tool_name,
                                parameters=merged_parameters,
                            ),
                        )
                    )

        answer = message.strip()
        if len(clarification.missing_parameters) != 1 or not answer:
            return None

        return Plan(
            steps=(
                ExecutionStep(
                    tool_name=clarification.tool_name,
                    parameters={
                        **clarification.parameters,
                        clarification.missing_parameters[0]: answer,
                    },
                ),
            )
        )

    @staticmethod
    def _build_continuation_prompt(
        message: str,
        clarification: Clarification,
    ) -> str:
        return (
            f"{_PROMPT}\n\n"
            "Complete the pending single-tool plan using the user's "
            "clarification. Keep the same tool.\n\n"
            f"Tool name:\n{json.dumps(clarification.tool_name)}\n\n"
            "Existing parameters:\n"
            f"{json.dumps(clarification.parameters)}\n\n"
            "Missing parameters:\n"
            f"{json.dumps(clarification.missing_parameters)}\n\n"
            f"Original request:\n{json.dumps(clarification.original_message)}"
            "\n\n"
            f"User clarification:\n{json.dumps(message)}"
        )

    @staticmethod
    def _required_parameters(tool_name: str) -> list[str]:
        try:
            tool = tool_registry.get(tool_name)
            handler_parameters = signature(tool.handler).parameters.values()
        except (KeyError, TypeError, ValueError):
            return []

        return [
            parameter.name
            for parameter in handler_parameters
            if parameter.name != "context"
            and parameter.default is Parameter.empty
            and parameter.kind
            in {
                Parameter.POSITIONAL_ONLY,
                Parameter.POSITIONAL_OR_KEYWORD,
                Parameter.KEYWORD_ONLY,
            }
        ]

    @classmethod
    def _missing_parameters(
        cls,
        tool_name: str,
        parameters: dict[str, Any],
    ) -> tuple[str, ...]:
        missing: list[str] = []
        for parameter_name in cls._required_parameters(tool_name):
            value = parameters.get(parameter_name)
            if (
                parameter_name not in parameters
                or value is None
                or (isinstance(value, str) and not value.strip())
            ):
                missing.append(parameter_name)
        return tuple(missing)

    @classmethod
    def _require_or_return_plan(
        cls,
        plan: Plan,
        *,
        original_message: str,
        question: str | None = None,
    ) -> Plan | Clarification:
        step = plan.steps[0]
        missing_parameters = cls._missing_parameters(
            step.tool_name,
            step.parameters,
        )
        if not missing_parameters:
            return plan

        return Clarification(
            tool_name=step.tool_name,
            parameters=step.parameters,
            missing_parameters=missing_parameters,
            question=question
            or cls._default_clarification_question(missing_parameters),
            original_message=original_message,
        )

    @staticmethod
    def _clarification_question(
        value: Any,
        missing_parameters: tuple[str, ...],
    ) -> str | None:
        if not missing_parameters or not isinstance(value, dict):
            return None
        question = value.get("question")
        if not isinstance(question, str) or not question.strip():
            return None
        return question.strip()

    @staticmethod
    def _default_clarification_question(
        missing_parameters: tuple[str, ...],
    ) -> str:
        readable_parameters = [
            parameter.replace("_", " ") for parameter in missing_parameters
        ]
        if len(readable_parameters) == 1:
            return f"What should I use for {readable_parameters[0]}?"
        joined_parameters = ", ".join(readable_parameters[:-1])
        return (
            "What should I use for "
            f"{joined_parameters} and {readable_parameters[-1]}?"
        )
