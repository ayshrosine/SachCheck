"""Assistant tool backed by the shared history service."""

from app.assistant.context import ApplicationContext
from app.assistant.registry import Tool, tool_registry
from app.assistant.types import ToolResult
from app.services.history_service import history_service


async def get_history(
    *,
    context: ApplicationContext,
    device_id: str,
    limit: int = 20,
) -> ToolResult:
    """Retrieve recent scans for a device."""
    scans = await history_service.get_recent_scans(
        device_id=device_id,
        limit=limit,
    )
    return ToolResult(
        success=True,
        message="History retrieved.",
        data={
            "scans": [scan.model_dump(mode="json") for scan in scans]
        },
    )


tool_registry.register(
    Tool(
        name="get_history",
        description="Returns recent scan history.",
        handler=get_history,
    )
)
