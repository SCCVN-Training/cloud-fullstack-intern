# SkillVerse — Backend

FastAPI service providing authentication and user management for the SkillVerse platform.

## Tech stack

- **Python 3** + **FastAPI** — REST API framework with automatic OpenAPI docs
- **SQLAlchemy (async)** + **asyncpg/psycopg** — ORM and PostgreSQL driver
- **PostgreSQL** (hosted on [Neon](https://neon.tech)) — relational database
- **python-jose** + **passlib/bcrypt** — JWT auth and password hashing
- **Pydantic** — request/response validation and settings management

## Project structure

```
app/
├── main.py              # App entrypoint, router registration, exception handlers
├── core/                # Cross-cutting concerns (config, DB, security, exceptions)
├── common/               # Shared enums used across modules
├── modules/
│   ├── auth/            # Register, login, current-user endpoints
│   └── users/           # User CRUD (list/get/update/delete)
├── scripts/
│   └── seed.py          # Creates tables + inserts sample users
└── tests/                # Unit/integration tests
```

Each module follows a **router -> service -> repository** layering:

- **router** — HTTP layer only (parses input, calls the service, returns the response)
- **service** — business rules and authorization (e.g. "only an admin may list all users")
- **repository** — the only layer that talks to the database

## Setup

### 1. Create and activate a virtual environment

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment variables

Create a `.env` file in `backend/` (already git-ignored) with:

```
DATABASE_URL=postgresql+psycopg://<user>:<password>@<host>/<db>?sslmode=require
SECRET_KEY=<a long random string>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

`DATABASE_URL` points at your PostgreSQL instance (a free [Neon](https://neon.tech) project works well for this). `SECRET_KEY` signs JWT access tokens — generate one with:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 4. Create tables and seed sample data

```bash
python -m app.scripts.seed
```

This creates the `users` table (if it doesn't exist) and inserts three sample accounts:

| email                | password     | role  |
| -------------------- | ------------ | ----- |
| admin@skillverse.dev | AdminPass123 | ADMIN |
| alice@skillverse.dev | AlicePass123 | USER  |
| bob@skillverse.dev   | BobPass123   | USER  |

Safe to re-run — it skips any email that already exists.

### 5. Run the server

```bash
uvicorn app.main:app --reload
```

The API is now live at `http://127.0.0.1:8000`.

## Exploring the API

- **Interactive docs (Swagger UI):** http://127.0.0.1:8000/docs
- **Postman collection:** import `SkillVerse.postman_collection.json` from this folder. It includes `base_url`, `access_token`, and `user_id` as collection variables — Register and Login requests auto-populate the latter two via a test script, so you can run the whole flow without manual copy/paste.

### Typical flow

1. `POST /auth/register` — create an account
2. `POST /auth/login` — get a JWT access token
3. `GET /auth/me` — confirm the token works
4. `GET /users/{id}`, `PATCH /users/{id}`, `DELETE /users/{id}` — self-service on your own account
5. `GET /users` — listing all users requires an **ADMIN** role (use the seeded admin account to test this; a non-admin gets `403 Forbidden`)

## Authorization model

| Endpoint                                                     | Who can call it                  |
| ------------------------------------------------------------ | -------------------------------- |
| `POST /auth/register`, `POST /auth/login`                    | Anyone                           |
| `GET /auth/me`                                               | Any authenticated user           |
| `GET /users` (list)                                          | Admin only                       |
| `GET /users/{id}`, `PATCH /users/{id}`, `DELETE /users/{id}` | The user themselves, or an admin |

## Running tests

```bash
pytest
```

(Test suite is being filled in — see `app/tests/`.)
