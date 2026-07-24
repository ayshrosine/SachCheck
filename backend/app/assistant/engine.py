"""Core assistant engine."""

from time import monotonic
from uuid import uuid4

from app.assistant.context import ApplicationContext
from app.assistant.executor import ExecutionEngine
from app.assistant.planner import Clarification, Planner
from app.assistant.types import (
    AssistantChatResponse,
    AssistantClarification,
)


_CLARIFICATION_TTL_SECONDS = 15 * 60
_MAX_PENDING_CLARIFICATIONS = 256


class AssistantEngine:
    """Orchestrate planning and tool execution."""

    def __init__(self) -> None:
        self._planner = Planner()
        self._executor = ExecutionEngine()
        self._pending_clarifications: dict[
            str,
            tuple[float, Clarification],
        ] = {}

    async def process(
        self,
        message: str,
        clarification_id: str | None = None,
    ) -> AssistantChatResponse:
        """Plan and process an assistant message."""
        context = ApplicationContext.default()
        clarification = (
            self._take_clarification(clarification_id)
            if clarification_id is not None
            else None
        )
        if clarification_id is not None and clarification is None:
            return AssistantChatResponse(
                success=False,
                response="That clarification is no longer active.",
            )

        decision = await self._planner.plan(message, clarification)
        if isinstance(decision, Clarification):
            stored_clarification_id = self._store_clarification(decision)
            return AssistantChatResponse(
                success=True,
                response=decision.question,
                clarification=AssistantClarification(
                    id=stored_clarification_id,
                    question=decision.question,
                    missing_parameters=list(decision.missing_parameters),
                ),
            )

        if decision is None:
            if clarification is not None:
                return AssistantChatResponse(
                    success=False,
                    response=(
                        "I couldn't determine the required information."
                    ),
                )
            return AssistantChatResponse(
                success=True,
                response="Jarvis initialized.",
            )

        result = await self._executor.execute(decision, context)
        return AssistantChatResponse(
            success=result.success,
            response=result.message,
            action=result.action,
        )

    def _store_clarification(self, clarification: Clarification) -> str:
        self._remove_expired_clarifications()
        if len(self._pending_clarifications) >= _MAX_PENDING_CLARIFICATIONS:
            oldest_id = next(iter(self._pending_clarifications))
            self._pending_clarifications.pop(oldest_id)

        clarification_id = str(uuid4())
        self._pending_clarifications[clarification_id] = (
            monotonic() + _CLARIFICATION_TTL_SECONDS,
            clarification,
        )
        return clarification_id

    def _take_clarification(
        self,
        clarification_id: str,
    ) -> Clarification | None:
        entry = self._pending_clarifications.pop(clarification_id, None)
        if entry is None:
            return None

        expires_at, clarification = entry
        if expires_at <= monotonic():
            return None
        return clarification

    def _remove_expired_clarifications(self) -> None:
        current_time = monotonic()
        expired_ids = [
            clarification_id
            for clarification_id, entry in self._pending_clarifications.items()
            if entry[0] <= current_time
        ]
        for clarification_id in expired_ids:
            self._pending_clarifications.pop(clarification_id)
