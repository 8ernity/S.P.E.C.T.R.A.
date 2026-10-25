from fastapi import APIRouter
from ..core.config import settings

router = APIRouter(tags=["Health"])

@router.get("/health")
def get_health():
    return {
        "status": "ok",
        "system": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "adaptionConfigured": bool(settings.ADAPTION_API_KEY),
        "adaptionModel": settings.ADAPTION_MODEL
    }
