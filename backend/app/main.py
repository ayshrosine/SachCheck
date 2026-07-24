from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
import sentry_sdk
from app.config import settings
from app.db import db
from app.routers import assistant, auth, scan, whatsapp
from app.rate_limit import limiter, rate_limit_handler
from app.schemas import HealthResponse
from datetime import datetime


# Initialize Sentry if DSN is provided
if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.environment,
        traces_sample_rate=0.1,  # Adjust based on your needs
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan"""
    # Startup
    await db.connect()
    print("Database connected")
    
    yield
    
    # Shutdown
    await db.disconnect()
    print("Database disconnected")


# Create FastAPI app
app = FastAPI(
    title="SachCheck API",
    description="Deepfake detection and media analysis API",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add rate limit exception handler
app.add_exception_handler(RateLimitExceeded, rate_limit_handler)
app.state.limiter = limiter


# Include routers
app.include_router(scan.router, prefix="/api", tags=["scan"])
app.include_router(auth.router, prefix="/api", tags=["auth"])
app.include_router(whatsapp.router, prefix="/api", tags=["whatsapp"])
app.include_router(assistant.router, tags=["assistant"])


@app.get("/", response_model=HealthResponse)
async def root():
    """Root health check"""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        timestamp=datetime.utcnow()
    )


@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": settings.environment,
        "services": {
            "database": "connected" if db.pool else "disconnected",
            "storage": "configured",
            "model_router": "configured"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
