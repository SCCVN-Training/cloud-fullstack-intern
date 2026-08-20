# Otakutory

Otakutory is a web application where users can create a personal profile and share their interests in anime, manga, games, and music. The project uses both internal data and free public APIs to enrich user profiles.

## Tech Stack

- **Frontend:** Angular
- **Backend:** FastAPI
- **Database:** PostgreSQL, MongoDB

## Local Setup

### Prerequisites

- Node.js
- Python 3.14+
- PostgreSQL
- MongoDB
- Git

### Clone the repository

### Frontend

```bash
cd frontend-angular
npm install
npm start
```

### Backend

#### Monolithic

```bash
cd backend-fastapi-v2
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### Microservices (using uv)

```bash
cd microservices
uv sync --all-packages
```

After that, run the file `run-services.bat`

## Contribution

1. Create a new branch.
2. Make your changes.
3. Commit and push your branch.
4. Open a Pull Request.

## Project Status

🚧 This project is currently under development.
