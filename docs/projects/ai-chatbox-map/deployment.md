# Deployment

The project is fully **Dockerized**: a React SPA served by nginx, and a FastAPI backend. It currently runs locally via Docker Compose, with paths toward cloud deployment (AWS) under consideration.

## Services

| Service | Image | Port | Description |
|---------|-------|------|-------------|
| `frontend` | nginx:alpine | 3000→80 | React SPA + reverse proxy for `/api` |
| `backend` | python:3.12-slim | 8000 | FastAPI app |

## Docker Compose

```yaml
services:
  frontend:
    build: ./frontend
    ports: ["3000:80"]
    env_file: ./frontend/.env
    depends_on: [backend]

  backend:
    build: ./backend
    ports: ["8000:8000"]
    env_file: ./backend/.env
    volumes:
      - ./backend/data:/app/data   # session memory persistence
```

### Start / Stop

```bash
docker compose up -d --build      # start
docker compose down               # stop
docker compose logs -f            # view logs
```

## Configuration

Environment variables are injected at **build time** for the frontend and **runtime** for the backend:

**Frontend** (`frontend/.env`):
```
REACT_APP_API_BASE=/api
```

**Backend** (`backend/.env`):
```
GEMINI_API_KEY=...
MAPBOX_TOKEN=...
```

## Nginx Proxy

The frontend nginx config serves static files and proxies API requests to the backend container:

```nginx
location /api/ {
    proxy_pass http://backend:8000;
    ...
}
```

## Local Development (without Docker)

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000

# Frontend
cd frontend
npm install
npm start
```

## Testing

```bash
cd backend
source .venv/bin/activate
PYTHONPATH=. pytest tests/ -v
```

## Health Check

```
GET http://localhost:8000/health
```

## Cloud Options (Roadmap)

The project is designed to be cloud deployable. Candidate approaches include:

- **AWS**: ECS Fargate for both services, ALB for routing, EFS for session memory persistence, CloudFront + Route 53 for DNS/SSL
