"""Registration and execution infrastructure for assistant tools."""

from collections.abc import Callable
from dataclasses import dataclass
from inspect import isawaitable
from typing import Any


ToolHandler = Callable[..., Any]


@dataclass(frozen=True, slots=True)
class Tool:
    """A named operation available to the assistant."""

    name: str
    description: str
    handler: ToolHandler


class ToolRegistry:
    """Store and execute assistant tools by name."""

    def __init__(self) -> None:
        self._tools: dict[str, Tool] = {}

    def register(self, tool: Tool) -> None:
        """Register a tool, rejecting duplicate names."""
        if tool.name in self._tools:
            raise ValueError(f"Tool '{tool.name}' is already registered.")
        self._tools[tool.name] = tool

    def get(self, name: str) -> Tool:
        """Return a registered tool by name."""
        try:
            return self._tools[name]
        except KeyError:
            raise KeyError(f"Tool '{name}' is not registered.") from None

    async def execute(self, name: str, **kwargs: Any) -> Any:
        """Execute a tool and await its result when necessary."""
        result = self.get(name).handler(**kwargs)
        if isawaitable(result):
            return await result
        return result

    def list_tools(self) -> list[Tool]:
        """Return all registered tools in registration order."""
        return list(self._tools.values())


def _health_check() -> str:
    return "Jarvis operational."


tool_registry = ToolRegistry()
tool_registry.register(
    Tool(
        name="health_check",
        description="Returns Jarvis status.",
        handler=_health_check,
    )
)
