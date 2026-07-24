"""Assistant application context."""

from dataclasses import dataclass, field
from typing import Any, Self


@dataclass(frozen=True, slots=True)
class ApplicationContext:
    """Current application state available to assistant tools."""

    current_user: str | None = None
    current_page: str | None = None
    selected_resource: str | None = None
    language: str | None = None
    permissions: list[str] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def default(cls) -> Self:
        """Create an empty application context."""
        return cls()
