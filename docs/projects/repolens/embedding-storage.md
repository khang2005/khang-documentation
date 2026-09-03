# Embedding Generation and Vector Storage

RepoLens uses OpenAI embeddings to convert code and documentation chunks into dense vector representations, then stores them in PostgreSQL with pgvector for efficient similarity search.

## Embedding Model

RepoLens uses the `text-embedding-3-small` model from OpenAI. This model produces 1536-dimensional embeddings optimized for semantic similarity across code and natural language.

### Why text-embedding-3-small

| Criterion | Consideration |
|-----------|--------------|
| **Dimension** | 1536 dimensions balance retrieval quality with storage cost |
| **Code understanding** | Trained on code-text pairs, handles technical vocabulary |
| **Cost** | Lower per-token cost than `text-embedding-3-large` at acceptable quality |
| **Rate limits** | Higher throughput limits than larger models |
| **Context window** | Supports up to 8191 tokens per input, covering all chunk sizes |

### Embedding Generation

Chunks are embedded in batches to respect API rate limits. The batching strategy groups chunks by token count to maximize throughput without exceeding per-request limits.

```python
import openai
from tenacity import retry, wait_exponential, stop_after_attempt

client = openai.AsyncOpenAI()

@retry(wait=wait_exponential(multiplier=1, min=2, max=30), stop=stop_after_attempt(5))
async def embed_chunks(chunks: list[str], batch_size: int = 100) -> list[list[float]]:
    embeddings = []
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i + batch_size]
        response = await client.embeddings.create(
            model="text-embedding-3-small",
            input=batch
        )
        embeddings.extend([item.embedding for item in response.data])
    return embeddings
```

### Retry Logic

The embedding service implements exponential backoff with jitter for transient failures. After 5 consecutive failures for the same batch, the ingestion job is paused and the failure is logged for manual investigation.

## Vector Storage

### PostgreSQL with pgvector

pgvector extends PostgreSQL with vector column types and similarity search operators. RepoLens stores embeddings alongside chunk metadata in a single relational database, avoiding the operational complexity of a separate vector database.

### Schema Design

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE repositories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    github_url TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    owner TEXT NOT NULL,
    branch TEXT NOT NULL DEFAULT 'main',
    description TEXT,
    default_branch TEXT NOT NULL,
    last_synced_commit TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    start_line INTEGER NOT NULL,
    end_line INTEGER NOT NULL,
    chunk_type TEXT NOT NULL,
    function_name TEXT,
    class_name TEXT,
    commit_hash TEXT,
    commit_date TIMESTAMPTZ,
    token_count INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chunks_embedding ON chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_chunks_repo ON chunks(repository_id);
CREATE INDEX idx_chunks_file_path ON chunks(file_path);
CREATE INDEX idx_chunks_chunk_type ON chunks(chunk_type);
```

### HNSW Index Configuration

The HNSW (Hierarchical Navigable Small World) index provides fast approximate nearest neighbor search. RepoLens configures the index with parameters tuned for the expected data characteristics:

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| `m` | 16 | Connections per node — balances search quality with index size |
| `ef_construction` | 200 | Build-time search width — higher values improve recall at build cost |
| `ef_search` | 100 | Query-time search width — adjustable at query time for quality/speed tradeoff |

```sql
CREATE INDEX idx_chunks_embedding ON chunks
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 200);
```

### Similarity Search

The retrieval query uses cosine distance to find the most similar chunks:

```sql
SELECT
    id,
    content,
    file_path,
    start_line,
    end_line,
    chunk_type,
    function_name,
    class_name,
    1 - (embedding <=> $1::vector) AS similarity
FROM chunks
WHERE repository_id = $2
    AND 1 - (embedding <=> $1::vector) > $3
ORDER BY embedding <=> $1::vector
LIMIT $4;
```

The `<=>` operator computes cosine distance. Subtracting from 1 converts it to cosine similarity for human-readable scoring.

## Storage Optimization

### Approximate Token Counting

Token counts are estimated using a character-based heuristic (`len(text) / 4`) rather than running a full tokenizer during ingestion. This is sufficient for chunk sizing decisions and avoids the overhead of tokenizing every chunk twice.

### Batch Insertion

Chunks are inserted in batches of 500 to minimize transaction overhead:

```python
async def store_chunks(chunks: list[ChunkData]) -> None:
    async with db.transaction() as tx:
        for i in range(0, len(chunks), 500):
            batch = chunks[i:i + 500]
            await tx.executemany(
                """INSERT INTO chunks (repository_id, content, embedding, file_path,
                   file_type, start_line, end_line, chunk_type, function_name,
                   class_name, commit_hash, commit_date, token_count)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)""",
                batch
            )
```

## Connection Pooling

The backend uses `asyncpg` connection pooling to manage PostgreSQL connections efficiently. Pool size is configurable and defaults to 10 connections, which handles concurrent ingestion and query operations without exhausting PostgreSQL's connection limit.
