"""propose: http endpoints for the sky blink tool.
input: http requests.
output: json responses (health, benchmark targets)."""

from fastapi import APIRouter

from src.core.settings import settings

router = APIRouter()


@router.get("/health")
def health() -> dict:
    return {"status": "ok", "data_releases": settings.DATA_RELEASES}


@router.get("/api/targets")
def targets() -> list[dict]:
    return settings.TARGETS


# ponytail: no /api/cutouts route yet, it comes in the features task
