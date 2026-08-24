# Use the official Python slim image for a lightweight base
FROM python:3.12-slim-bookworm

# Copy the uv binaries directly from the official astral-sh image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Configure uv behavior for optimal Docker image size and performance
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PYTHONUNBUFFERED=1

# Set the working directory inside the container
WORKDIR /app

# Copy the entire workspace into the container
COPY . /app

# Sync dependencies using the workspace lockfile
# The --frozen flag ensures it strictly uses uv.lock without updating it
# The --no-dev flag ignores development dependencies (like pytest)
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

# Define a build argument to specify which microservice to run
# Expected values: auth, profile, anime
ARG SERVICE_NAME

# Set it as an environment variable so the CMD can use it
ENV SERVICE_DIR=${SERVICE_NAME}

# Expose the standard FastAPI port
EXPOSE 8000

# Start the application using uv to ensure the virtual environment is activated
# This assumes your entrypoint is named main.py and exposes an 'app' instance
CMD uv run uvicorn ${SERVICE_DIR}.main:app --host 0.0.0.0 --port 8000
