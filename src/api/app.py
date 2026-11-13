"""propose: fastapi app serving the api and the web frontend.
input: settings (WEB_DIR), routes.
output: asgi `app` for uvicorn."""

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from src.api.routes import router
from src.core.settings import settings

app = FastAPI(title=settings.PROJECT_NAME)
app.include_router(router)
# mounted last so api routes win over static files
app.mount("/", StaticFiles(directory=settings.WEB_DIR, html=True), name="web")
