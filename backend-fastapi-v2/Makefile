# .PHONY tells make these are not actual files, just command names
.PHONY: help up down logs test lint format clean

# Default target - shows available commands
help:
	@echo "Available commands:"
	@echo "  make up       Start all services"
	@echo "  make down     Stop all services"
	@echo "  make logs     Show logs"
	@echo "  make test     Run tests"
	@echo "  make lint     Run linting"
	@echo "  make format   Format code"
	@echo "  make clean    Clean up"

# Start Docker services in detached mode (background)
up:
	docker-compose up -d

# Stop and remove Docker services
down:
	docker-compose down

# Follow logs from all services (press Ctrl+C to exit)
logs:
	docker-compose logs -f

# Run all tests
test:
	pytest tests/

# Run linters
lint:
	ruff check .          # Fast linter
	mypy .                # Type checker

# Auto-format code
format:
	black .               # Format code
	isort .               # Sort imports

# Clean up everything (remove containers, volumes, cache)
clean:
	docker-compose down -v                              # Remove containers and volumes
	find . -type d -name "__pycache__" -exec rm -rf {} +  # Remove Python cache
	find . -type d -name ".pytest_cache" -exec rm -rf {} + # Remove test cache
