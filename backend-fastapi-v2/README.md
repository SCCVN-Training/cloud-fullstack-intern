# Backend V2

A monolithic FastAPI backend designed for easy migration to microservices.

## Architecture Overview

This project follows a **modular monolith** approach:

- Each domain (auth, profile, anime, manga, music) is in its own module
- Modules are self-contained (models, schemas, repositories, services, routers)
- Shared code lives in `shared/` (database, security, base repository)
- The API Gateway aggregates all routes
- Feature flags control which modules are active

## Tech Stack

- **Framework**: FastAPI 0.104+
- **Database**: PostgreSQL (asyncpg) + MongoDB (motor)
- **ORM**: SQLAlchemy 2.0 (async)
- **Authentication**: JWT with refresh tokens
- **Validation**: Pydantic 2.0
- **Testing**: Pytest (async)
- **Deployment**: Docker + Docker Compose
