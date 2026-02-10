from fastapi import FastAPI

app = FastAPI(title="Opsfluence")

@app.get("/health")
def health_check():
    return {"status": "ok"}