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

# Force the working directory to jump inside the specific microservice folder
# (e.g., /app/auth-service, /app/profile-service)
WORKDIR /app/${SERVICE_NAME}-service

# Expose the standard FastAPI port
EXPOSE 8000

# Start the application locally from within the service directory
# Now it can find main.py directly without complex module paths
CMD ["uv", "run", "opentelemetry-instrument", "--traces_exporter", "otlp", "--metrics_exporter", "none", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
