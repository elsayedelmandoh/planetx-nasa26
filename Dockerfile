FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/app/.venv

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:0.11.2 /uv /usr/local/bin/uv

COPY pyproject.toml README.md ./
COPY src/ ./src/
COPY configs/ ./configs/
COPY web/ ./web/

RUN uv sync --no-dev

RUN useradd --create-home --uid 10001 app && chown -R app:app /app
USER app

EXPOSE 8000

CMD ["uv", "run", "--no-dev", "uvicorn", "src.api.app:app", "--host", "0.0.0.0", "--port", "8000"]
