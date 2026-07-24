"""Assistant tools backed by the shared scan service."""

from fastapi import UploadFile

from app.assistant.context import ApplicationContext
from app.assistant.registry import Tool, tool_registry
from app.assistant.types import ToolResult
from app.services.scan_service import scan_service


async def scan_image(
    *,
    file: UploadFile,
    context: ApplicationContext,
    device_id: str | None = None,
) -> ToolResult:
    """Scan an uploaded image."""
    result = await scan_service.scan(file=file, device_id=device_id)
    return ToolResult(
        success=True,
        message="Scan completed.",
        data=result.model_dump(mode="json"),
    )


async def scan_video(
    *,
    file: UploadFile,
    context: ApplicationContext,
    device_id: str | None = None,
) -> ToolResult:
    """Scan an uploaded video."""
    result = await scan_service.scan(file=file, device_id=device_id)
    return ToolResult(
        success=True,
        message="Scan completed.",
        data=result.model_dump(mode="json"),
    )


async def scan_audio(
    *,
    file: UploadFile,
    context: ApplicationContext,
    device_id: str | None = None,
) -> ToolResult:
    """Scan an uploaded audio file."""
    result = await scan_service.scan(file=file, device_id=device_id)
    return ToolResult(
        success=True,
        message="Scan completed.",
        data=result.model_dump(mode="json"),
    )


tool_registry.register(
    Tool(
        name="scan_image",
        description="Scans an image for manipulation.",
        handler=scan_image,
    )
)
tool_registry.register(
    Tool(
        name="scan_video",
        description="Scans a video for manipulation.",
        handler=scan_video,
    )
)
tool_registry.register(
    Tool(
        name="scan_audio",
        description="Scans audio for manipulation.",
        handler=scan_audio,
    )
)
