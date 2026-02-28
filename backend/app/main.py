from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import incidents, metrics
from app.api.users import router as users_router
from app.core.config import settings

app = FastAPI(title="Opsfluence", redirect_slashes=False)


# -------------------------
# CORS
# -------------------------

origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------
# Health Check
# -------------------------

@app.get("/health")
def health_check():
    return {"status": "ok"}


# -------------------------
# Routers
# -------------------------

app.include_router(users_router)
app.include_router(incidents.router)
app.include_router(metrics.router)