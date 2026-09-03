# Documentation/reference only — not required to run this project
# locally (see scripts/run-marketplace.sh instead). This is what
# containerizing this service would look like once Docker is available,
# e.g. for an AWS deployment step later in the course.
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

EXPOSE 8002
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002"]