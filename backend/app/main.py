from fastapi import FastAPI

from app.api import auth, incidents, metrics
from app.api.users import router as users_router

app = FastAPI(title="Opsfluence")


# -------------------------
# Health Check
# -------------------------
@app.get("/health")
def health_check():
    return {"status": "ok"}


# -------------------------
# Routers
# -------------------------


app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users_router)
app.include_router(incidents.router)
app.include_router(metrics.router)