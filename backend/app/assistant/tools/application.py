"""Assistant tools that request frontend application actions."""

from app.assistant.context import ApplicationContext
from app.assistant.registry import Tool, tool_registry
from app.assistant.types import AssistantAction, ToolResult


def open_privacy_policy(*, context: ApplicationContext) -> ToolResult:
    """Request navigation to the privacy policy."""
    return ToolResult(
        success=True,
        message="Opening the privacy policy.",
        action=AssistantAction(
            type="navigate",
            payload={"route": "/privacy"},
        ),
    )


def close_assistant(*, context: ApplicationContext) -> ToolResult:
    """Request that the Jarvis overlay close."""
    return ToolResult(
        success=True,
        message="Closing Jarvis.",
        action=AssistantAction(
            type="close_overlay",
            payload={},
        ),
    )


def focus_assistant_input(*, context: ApplicationContext) -> ToolResult:
    """Request focus for the Jarvis message input."""
    return ToolResult(
        success=True,
        message="Jarvis is ready.",
        action=AssistantAction(
            type="focus_input",
            payload={},
        ),
    )


tool_registry.register(
    Tool(
        name="open_privacy_policy",
        description="Opens the application's privacy policy.",
        handler=open_privacy_policy,
    )
)
tool_registry.register(
    Tool(
        name="close_assistant",
        description="Closes the Jarvis assistant overlay.",
        handler=close_assistant,
    )
)
tool_registry.register(
    Tool(
        name="focus_assistant_input",
        description="Focuses the Jarvis message input.",
        handler=focus_assistant_input,
    )
)
