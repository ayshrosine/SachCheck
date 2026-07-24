"""Execution planning for assistant requests."""

import json
from dataclasses import dataclass, field, replace
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
_FALLBACK_WORKFLOWS = {
    "open privacy and close jarvis": (
        "open_privacy_policy",
        "close_assistant",
    ),
    "Open privacy and close Jarvis.": (
        "open_privacy_policy",
        "close_assistant",
    ),
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
    """Information needed before a plan can be executed."""

    tool_name: str
    parameters: dict[str, Any]
    missing_parameters: tuple[str, ...]
    question: str
    original_message: str
    plan: Plan | None = None
    step_index: int = 0


class Planner:
    """Translate supported messages into execution plans."""

    async def plan(
        self,
        message: str,
        clarification: Clarification | None = None,
    ) -> Plan | Clarification | None:
        """Create an ordered execution plan for a user message."""
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

        raw_steps = payload.get("steps")
        if raw_steps is None:
            raw_steps = [
                {
                    "tool_name": payload.get("tool_name"),
                    "parameters": payload.get("parameters"),
                }
            ]
        if not isinstance(raw_steps, list) or not raw_steps:
            return None

        registered_tools = {
            tool.name for tool in tool_registry.list_tools()
        }
        steps: list[ExecutionStep] = []
        for raw_step in raw_steps:
            if not isinstance(raw_step, dict):
                return None
            tool_name = raw_step.get("tool_name")
            parameters = raw_step.get("parameters")
            if (
                not isinstance(tool_name, str)
                or not isinstance(parameters, dict)
                or tool_name not in registered_tools
            ):
                return None
            steps.append(
                ExecutionStep(
                    tool_name=tool_name,
                    parameters=parameters,
                )
            )

        plan = Plan(steps=tuple(steps))
        question = cls._clarification_question(payload.get("clarification"))
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
        workflow = _FALLBACK_WORKFLOWS.get(message)
        if workflow is None:
            tool_name = _FALLBACK_TOOLS.get(message)
            if tool_name is None:
                return None
            workflow = (tool_name,)

        return cls._require_or_return_plan(
            Plan(
                steps=tuple(
                    ExecutionStep(tool_name=tool_name)
                    for tool_name in workflow
                )
            ),
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
                matching_steps = [
                    step
                    for step in decision.steps
                    if step.tool_name == clarification.tool_name
                ]
                step = (
                    matching_steps[0]
                    if len(matching_steps) == 1
                    else None
                )
                parameters = step.parameters if step is not None else {}
            elif isinstance(decision, Clarification):
                parameters = (
                    decision.parameters
                    if decision.tool_name == clarification.tool_name
                    else {}
                )
            else:
                parameters = {}

            if parameters:
                merged_parameters = {
                    **clarification.parameters,
                    **parameters,
                }
                if not self._missing_parameters(
                    clarification.tool_name,
                    merged_parameters,
                ):
                    return self._complete_clarification(
                        clarification,
                        merged_parameters,
                    )

        answer = message.strip()
        if len(clarification.missing_parameters) != 1 or not answer:
            return None

        return self._complete_clarification(
            clarification,
            {
                **clarification.parameters,
                clarification.missing_parameters[0]: answer,
            },
        )

    @staticmethod
    def _build_continuation_prompt(
        message: str,
        clarification: Clarification,
    ) -> str:
        return (
            f"{_PROMPT}\n\n"
            "Complete only the pending step using the user's clarification. "
            "Return exactly one step and keep the same tool.\n\n"
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
    ) -> Plan | Clarification | None:
        missing_steps: list[
            tuple[int, ExecutionStep, tuple[str, ...]]
        ] = []
        for step_index, step in enumerate(plan.steps):
            missing_parameters = cls._missing_parameters(
                step.tool_name,
                step.parameters,
            )
            if missing_parameters:
                missing_steps.append(
                    (step_index, step, missing_parameters)
                )
        if not missing_steps:
            return plan
        if len(missing_steps) > 1:
            return None

        step_index, step, missing_parameters = missing_steps[0]

        return Clarification(
            tool_name=step.tool_name,
            parameters=step.parameters,
            missing_parameters=missing_parameters,
            question=question
            or cls._default_clarification_question(missing_parameters),
            original_message=original_message,
            plan=plan,
            step_index=step_index,
        )

    @staticmethod
    def _clarification_question(value: Any) -> str | None:
        if not isinstance(value, dict):
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

    @staticmethod
    def _complete_clarification(
        clarification: Clarification,
        parameters: dict[str, Any],
    ) -> Plan:
        if clarification.plan is None:
            return Plan(
                steps=(
                    ExecutionStep(
                        tool_name=clarification.tool_name,
                        parameters=parameters,
                    ),
                )
            )

        steps = list(clarification.plan.steps)
        step = steps[clarification.step_index]
        steps[clarification.step_index] = replace(
            step,
            parameters=parameters,
        )
        return replace(clarification.plan, steps=tuple(steps))
