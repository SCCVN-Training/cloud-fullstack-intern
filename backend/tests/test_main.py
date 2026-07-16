from fastapi.testclient import TestClient
from app.main import app  # Absolute import from the app directory

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello from FastAPI backend!"}