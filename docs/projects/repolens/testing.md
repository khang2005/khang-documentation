# Testing and Evaluation Strategy

RepoLens uses pytest for backend testing, with a layered test strategy that covers unit tests, integration tests, and end-to-end evaluation of the RAG pipeline.

## Test Layers

```mermaid
flowchart TD
    A[Tests] --> B[Unit Tests]
    A --> C[Integration Tests]
    A --> D[Evaluation Tests]

    B --> B1[Chunker Tests]
    B --> B2[Citation Extractor Tests]
    B --> B3[Embedding Service Tests]
    B --> B4[Token Counting Tests]

    C --> C1[API Endpoint Tests]
    C --> C2[Database Query Tests]
    C --> C3[Ingestion Pipeline Tests]
    C --> C4[Retrieval Pipeline Tests]

    D --> D1[Retrieval Quality]
    D --> D2[Response Groundedness]
    D --> D3[Citation Accuracy]
```

## Unit Tests

Unit tests verify individual functions and classes in isolation. External dependencies (database, GitHub API, OpenAI API) are mocked.

### Test Configuration

```python
# tests/conftest.py
import pytest
from unittest.mock import AsyncMock, MagicMock

@pytest.fixture
def mock_openai_client():
    client = AsyncMock()
    client.embeddings.create.return_value = MagicMock(
        data=[MagicMock(embedding=[0.1] * 1536)]
    )
    return client

@pytest.fixture
def mock_db():
    db = AsyncMock()
    db.fetch.return_value = []
    return db

@pytest.fixture
def sample_chunks():
    return [
        ChunkData(
            content="def validate_token(token: str) -> TokenPayload:",
            file_path="src/auth/jwt.py",
            start_line=45,
            end_line=82,
            chunk_type="code",
            function_name="validate_token",
            token_count=120
        ),
        ChunkData(
            content="class AuthenticationMiddleware:",
            file_path="src/auth/middleware.py",
            start_line=12,
            end_line=35,
            chunk_type="code",
            class_name="AuthenticationMiddleware",
            token_count=85
        )
    ]
```

### Unit Test Examples

**Chunker tests** verify that code is split at correct AST boundaries:

```python
def test_python_function_chunking():
    source = '''
import os

def validate_token(token: str) -> TokenPayload:
    """Validate a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY)
        return TokenPayload(**payload)
    except jwt.ExpiredSignatureError:
        raise AuthenticationError("Token expired")

def create_token(payload: TokenPayload) -> str:
    """Create a new JWT token."""
    return jwt.encode(payload.dict(), SECRET_KEY, algorithm="HS256")
'''
    chunks = chunk_code(source, language="python")
    assert len(chunks) == 2
    assert chunks[0].function_name == "validate_token"
    assert chunks[1].function_name == "create_token"
    assert chunks[0].start_line < chunks[0].end_line
```

**Citation extractor tests** verify reference validation:

```python
def test_valid_citation_extraction():
    response = "The function validates tokens [Source 1] and handles errors [Source 2]."
    context_chunks = [
        ChunkResult(content="def validate_token...", file_path="src/auth.py", start_line=1, end_line=20),
        ChunkResult(content="class AuthError...", file_path="src/errors.py", start_line=5, end_line=15),
    ]
    citations = extract_citations(response, context_chunks)
    assert len(citations) == 2
    assert citations[0].file_path == "src/auth.py"
    assert citations[1].file_path == "src/errors.py"

def test_invalid_citation_stripped():
    response = "Referenced [Source 1] and also [Source 99]."
    context_chunks = [
        ChunkResult(content="...", file_path="src/auth.py", start_line=1, end_line=20),
    ]
    citations = extract_citations(response, context_chunks)
    assert len(citations) == 1  # [Source 99] stripped
```

## Integration Tests

Integration tests verify that multiple components work together correctly. These tests use a real PostgreSQL database (via Docker) and mock external APIs.

### API Endpoint Tests

```python
@pytest.mark.asyncio
async def test_query_endpoint(client, mock_db, mock_openai):
    # Setup mock responses
    mock_db.fetch.return_value = [
        {"id": "1", "content": "def auth()...", "similarity": 0.85,
         "file_path": "src/auth.py", "start_line": 1, "end_line": 20}
    ]

    response = await client.post("/api/v1/query", json={
        "repository_id": "test-repo-id",
        "question": "How does authentication work?"
    })

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "citations" in data["data"]
    assert len(data["data"]["citations"]) > 0
```

### Ingestion Pipeline Tests

```python
@pytest.mark.integration
async def test_full_ingestion_pipeline(test_db, mock_github, mock_openai):
    # Ingest a small test repository
    repo = await connect_repository(
        github_url="https://github.com/test-org/test-repo",
        db=test_db
    )

    # Wait for ingestion to complete
    status = await wait_for_ingestion(repo.id, test_db, timeout=30)
    assert status == "ready"

    # Verify chunks were created
    chunks = await db.fetch(
        "SELECT COUNT(*) FROM chunks WHERE repository_id = $1", repo.id
    )
    assert chunks[0]["count"] > 0
```

## Evaluation Tests

Evaluation tests measure the quality of the RAG pipeline on a set of benchmark questions with known correct answers.

### Evaluation Dataset

The evaluation dataset contains questions with expected answers and source files:

```python
EVALUATION_QUESTIONS = [
    {
        "question": "How does the JWT token validation work?",
        "expected_files": ["src/auth/jwt.py"],
        "expected_keywords": ["jwt.decode", "SECRET_KEY", "ExpiredSignatureError"],
        "expected_behavior": "should describe token decoding and error handling"
    },
    {
        "question": "What middleware is used for authentication?",
        "expected_files": ["src/auth/middleware.py"],
        "expected_keywords": ["AuthenticationMiddleware", "exclude_paths"],
        "expected_behavior": "should describe request interception and token extraction"
    },
    {
        "question": "How is the database connection configured?",
        "expected_files": ["src/db/connection.py", "src/config.py"],
        "expected_keywords": ["asyncpg", "pool", "DATABASE_URL"],
        "expected_behavior": "should describe connection pooling and configuration"
    },
]
```

### Retrieval Quality Metrics

| Metric | Description | How Measured |
|--------|-------------|--------------|
| **Recall@8** | Fraction of relevant chunks in the top-8 retrieved | Compare retrieved file paths against expected files |
| **MRR** | Mean reciprocal rank of the first relevant result | Rank of first correct chunk across all questions |
| **Answer Groundedness** | Fraction of answer claims supported by retrieved context | Manual or LLM-based evaluation |

### Running Tests

```bash
# Unit tests only (fast, no external dependencies)
pytest tests/ -m "not integration" -v

# Integration tests (requires Docker for PostgreSQL)
pytest tests/ -m integration -v

# Full test suite
pytest tests/ -v

# With coverage report
pytest tests/ --cov=app --cov-report=html
```

## CI/CD Pipeline

The GitHub Actions workflow runs tests on every push and pull request.

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: pgvector/pgvector:pg16
        env:
          POSTGRES_USER: repolens
          POSTGRES_PASSWORD: repolens
          POSTGRES_DB: repolens_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Install dependencies
        run: |
          pip install -r backend/requirements.txt

      - name: Run migrations
        env:
          DATABASE_URL: postgresql+asyncpg://repolens:repolens@localhost:5432/repolens_test
        run: |
          cd backend && alembic upgrade head

      - name: Run tests
        env:
          DATABASE_URL: postgresql+asyncpg://repolens:repolens@localhost:5432/repolens_test
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          cd backend && pytest tests/ -v --tb=short

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: |
          pip install ruff mypy
          ruff check backend/app/
          mypy backend/app/ --ignore-missing-imports
```
