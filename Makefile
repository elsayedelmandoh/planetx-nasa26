.PHONY: install serve lint format test eval clean

# --- environment ---
install:
	uv sync

# --- run ---
serve:
	uv run uvicorn src.api.app:app --host 0.0.0.0 --port 8000 --reload

# --- quality ---
lint:
	uv run ruff check src/ tests/
	uv run ruff format --check src/ tests/

format:
	uv run ruff format src/ tests/
	uv run ruff check --fix src/ tests/

test:
	uv run pytest

# --- eval gate (offline benchmark checks) ---
eval:
	uv run python -m src.evals.runner --gate

# --- cleanup ---
clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null; \
	find . -type f -name '*.pyc' -delete; \
	rm -rf .pytest_cache .ruff_cache
