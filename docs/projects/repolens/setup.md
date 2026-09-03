# Installation and Usage

## Prerequisites

- **Python 3.12+** — Backend runtime
- **Node.js 18+** — Frontend build and development server
- **Docker and Docker Compose** — Container orchestration
- **GitHub Personal Access Token** — Repository access
- **OpenAI API Key** — Embeddings and generation

## Quick Start (Docker Compose)

This is the recommended way to run RepoLens locally. Docker Compose handles the database, backend, and frontend in isolated containers.

### 1. Clone and Configure

```bash
git clone https://github.com/your-org/repolens.git
cd repolens
cp .env.example .env
```

Edit `.env` and fill in your credentials:

```env
GITHUB_TOKEN=ghp_your_github_token_here
OPENAI_API_KEY=sk-your_openai_api_key_here
```

### 2. Start Services

```bash
docker compose up -d
```

This starts:

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | `http://localhost:5173` | React dashboard |
| Backend | `http://localhost:8000` | FastAPI API |
| PostgreSQL | `localhost:5432` | Database with pgvector |

### 3. Initialize Database

```bash
docker compose exec backend alembic upgrade head
```

### 4. Access the Dashboard

Open `http://localhost:5173` in your browser. Enter a GitHub repository URL in the repository manager to begin ingestion.

## Local Development Setup

For development without Docker, run each service separately.

### Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables (or use .env file)
export DATABASE_URL=postgresql+asyncpg://repolens:repolens@localhost:5432/repolens
export GITHUB_TOKEN=ghp_your_token
export OPENAI_API_KEY=sk-your_key

# Run migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Set API URL
echo "VITE_API_BASE_URL=http://localhost:8000" > .env

# Start development server
npm run dev
```

The frontend starts at `http://localhost:5173` with hot module replacement.

### PostgreSQL

If running PostgreSQL locally without Docker:

```bash
# Install pgvector (Ubuntu/Debian)
sudo apt install postgresql-16-pgvector

# Create database
psql -U postgres -c "CREATE USER repolens WITH PASSWORD 'repolens';"
psql -U postgres -c "CREATE DATABASE repolens OWNER repolens;"
psql -U postgres -d repolens -c "CREATE EXTENSION vector;"
```

## Usage Guide

### Connecting a Repository

1. Open the dashboard at `http://localhost:5173`
2. Click **Connect Repository** in the sidebar
3. Paste a GitHub repository URL (e.g., `https://github.com/myorg/myproject`)
4. Select the branch to index (defaults to `main`)
5. Click **Connect**

The ingestion process begins immediately. Progress is displayed in the sidebar with a status indicator showing the current stage (fetching files, parsing, embedding, storing).

### Asking Questions

Once ingestion completes, the repository status changes to **Ready**. Type a natural-language question in the query input:

```
How does the authentication system work?
```

The system retrieves relevant code chunks, generates a grounded response, and displays it with inline citations. Click any citation badge to view the source file and line range in the citation sidebar.

### Follow-Up Questions

RepoLens maintains conversation context. You can ask follow-up questions:

```
What happens when a token expires?
```

The system uses the prior conversation history to understand that "token" refers to the JWT authentication tokens discussed in the previous question.

### Browsing Indexed Files

The repository view shows all indexed files with chunk counts. This helps you understand what content is available for retrieval and identify any files that may not have been indexed correctly.

### Syncing Updates

When a repository receives new commits, click **Sync** on the repository card to fetch new and modified files. The sync operation performs a differential update, only processing changed files.
