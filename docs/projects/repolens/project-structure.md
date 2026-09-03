# Project Structure and Configuration

## Recommended Folder Structure

```
repolens/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI application entry point
│   │   ├── config.py               # Settings and environment variable loading
│   │   ├── dependencies.py         # Dependency injection (db, clients)
│   │   │
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── repositories.py     # /repositories endpoints
│   │   │   ├── queries.py          # /query endpoint
│   │   │   ├── conversations.py    # /conversations endpoints
│   │   │   └── health.py           # /health and /status endpoints
│   │   │
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── repository.py       # Repository Pydantic models
│   │   │   ├── chunk.py            # Chunk data classes
│   │   │   ├── query.py            # Query request/response models
│   │   │   └── conversation.py     # Conversation and message models
│   │   │
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── ingestion.py        # Repository ingestion orchestrator
│   │   │   ├── github_client.py    # GitHub API client
│   │   │   ├── chunker.py          # Code-aware chunking logic
│   │   │   ├── embedding.py        # OpenAI embedding service
│   │   │   ├── retrieval.py        # Vector search and reranking
│   │   │   ├── generation.py       # LLM response generation
│   │   │   └── citations.py        # Citation extraction and validation
│   │   │
│   │   ├── db/
│   │   │   ├── __init__.py
│   │   │   ├── connection.py       # Database connection pool setup
│   │   │   ├── queries.py          # SQL query functions
│   │   │   └── migrations/         # Schema migration scripts
│   │   │       ├── 001_initial.sql
│   │   │       └── 002_indexes.sql
│   │   │
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── token_count.py      # Approximate token counting
│   │       └── file_filter.py      # File exclusion logic
│   │
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py             # Pytest fixtures (db, mock clients)
│   │   ├── test_api/
│   │   │   ├── test_repositories.py
│   │   │   ├── test_queries.py
│   │   │   └── test_health.py
│   │   ├── test_services/
│   │   │   ├── test_chunker.py
│   │   │   ├── test_embedding.py
│   │   │   ├── test_retrieval.py
│   │   │   ├── test_generation.py
│   │   │   └── test_citations.py
│   │   └── test_db/
│   │       └── test_queries.py
│   │
│   ├── alembic.ini                 # Database migration configuration
│   ├── alembic/
│   │   └── env.py
│   ├── pyproject.toml              # Python project configuration
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── index.tsx               # React entry point
│   │   ├── App.tsx                 # Root component with routing
│   │   │
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Layout.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── MainContent.tsx
│   │   │   ├── repository/
│   │   │   │   ├── RepositoryList.tsx
│   │   │   │   ├── RepositoryCard.tsx
│   │   │   │   ├── IngestionProgress.tsx
│   │   │   │   └── RepositoryStats.tsx
│   │   │   ├── query/
│   │   │   │   ├── QueryInput.tsx
│   │   │   │   ├── QueryView.tsx
│   │   │   │   ├── ConversationHistory.tsx
│   │   │   │   └── MessageBubble.tsx
│   │   │   └── citations/
│   │   │       ├── CitationInline.tsx
│   │   │       ├── CitationSidebar.tsx
│   │   │       └── CitationCard.tsx
│   │   │
│   │   ├── contexts/
│   │   │   ├── RepositoryContext.tsx
│   │   │   ├── ConversationContext.tsx
│   │   │   └── SystemContext.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useRepository.ts
│   │   │   ├── useQuery.ts
│   │   │   └── useConversation.ts
│   │   │
│   │   ├── api/
│   │   │   └── client.ts           # API client with fetch wrapper
│   │   │
│   │   └── types/
│   │       └── index.ts            # TypeScript type definitions
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── Dockerfile
│
├── docker/
│   └── nginx/
│       └── nginx.conf              # Nginx config for frontend static serving
│
├── k8s/
│   ├── namespace.yaml
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── frontend-deployment.yaml
│   ├── frontend-service.yaml
│   ├── postgres-statefulset.yaml
│   ├── postgres-service.yaml
│   ├── configmap.yaml
│   └── secret.yaml
│
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── .gitignore
└── README.md
```

## Environment Variables

All configuration is managed through environment variables. The backend loads these via Pydantic Settings, which validates types and provides defaults.

### Backend Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `GITHUB_TOKEN` | Yes | — | GitHub personal access token for API access |
| `OPENAI_API_KEY` | Yes | — | OpenAI API key for embeddings and generation |
| `EMBEDDING_MODEL` | No | `text-embedding-3-small` | OpenAI embedding model |
| `GENERATION_MODEL` | No | `gpt-4o` | OpenAI model for response generation |
| `CHUNK_MIN_TOKENS` | No | `200` | Minimum tokens per code chunk |
| `CHUNK_MAX_TOKENS` | No | `500` | Maximum tokens per code chunk |
| `RETRIEVAL_TOP_K` | No | `20` | Number of candidates for initial retrieval |
| `RETRIEVAL_TOP_N` | No | `8` | Number of chunks after reranking |
| `SIMILARITY_THRESHOLD` | No | `0.3` | Minimum cosine similarity for retrieval |
| `TEMPERATURE` | No | `0.1` | LLM generation temperature |
| `MAX_TOKENS` | No | `2048` | Maximum tokens in LLM response |
| `DB_POOL_SIZE` | No | `10` | PostgreSQL connection pool size |
| `CORS_ORIGINS` | No | `http://localhost:5173` | Allowed CORS origins |
| `LOG_LEVEL` | No | `INFO` | Logging level |

### Frontend Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | Yes | — | Backend API base URL (e.g., `http://localhost:8000`) |

### .env.example

```env
# Database
DATABASE_URL=postgresql+asyncpg://repolens:repolens@localhost:5432/repolens

# GitHub
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# OpenAI
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx

# Backend
EMBEDDING_MODEL=text-embedding-3-small
GENERATION_MODEL=gpt-4o
CHUNK_MIN_TOKENS=200
CHUNK_MAX_TOKENS=500
RETRIEVAL_TOP_K=20
RETRIEVAL_TOP_N=8
SIMILARITY_THRESHOLD=0.3
TEMPERATURE=0.1
MAX_TOKENS=2048
DB_POOL_SIZE=10
CORS_ORIGINS=http://localhost:5173
LOG_LEVEL=INFO

# Frontend
VITE_API_BASE_URL=http://localhost:8000
```

## Configuration Management

### Backend Settings

The backend uses Pydantic Settings with a single `Settings` class that loads from environment variables and optionally from a `.env` file:

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    github_token: str
    openai_api_key: str
    embedding_model: str = "text-embedding-3-small"
    generation_model: str = "gpt-4o"
    chunk_min_tokens: int = 200
    chunk_max_tokens: int = 500
    retrieval_top_k: int = 20
    retrieval_top_n: int = 8
    similarity_threshold: float = 0.3
    temperature: float = 0.1
    max_tokens: int = 2048
    db_pool_size: int = 10
    cors_origins: str = "http://localhost:5173"
    log_level: str = "INFO"

    class Config:
        env_file = ".env"
```
