# Roadmap

RepoLens is a functional application deployed with Docker Compose and K3s. This section describes the current development direction and planned enhancements.

## Current Development Priorities

### In Progress

| Priority | Feature | Status |
|----------|---------|--------|
| High | **Multi-file diff context** — Include git diffs in chunk metadata so answers about recent changes reference both the before and after state | Design phase |
| High | **Conversation memory persistence** — Store conversations in the database so they survive server restarts and can be revisited | Implementation in progress |
| Medium | **Batch ingestion for monorepos** — Optimize the ingestion pipeline for repositories with 10,000+ files using parallel processing and progress streaming | Design phase |
| Medium | **File tree visualization** — Render the repository's directory structure in the frontend with chunk density heat map | In progress |

### Planned

| Priority | Feature | Description |
|----------|---------|-------------|
| High | **User authentication** — Add OAuth or API-key authentication to support multi-tenant deployments where different users index private repositories |
| High | **Streaming responses** — Stream LLM tokens to the frontend for real-time answer rendering instead of waiting for the complete response |
| Medium | **Cross-repository queries** — Allow users to ask questions that span multiple indexed repositories, with results indicating which repository each citation comes from |
| Medium | **Custom chunking rules** — Let users configure language-specific chunking behavior, such as grouping all functions within a file into a single chunk for small utility modules |
| Medium | **Ingestion webhook** — Accept GitHub webhook payloads to trigger automatic re-ingestion on push events instead of requiring manual sync |
| Low | **Usage analytics** — Track query patterns, most-indexed repositories, and retrieval quality metrics to guide prioritization |
| Low | **Export and sharing** — Export conversation threads as markdown or share citation sets with team members |

## Technical Debt

| Item | Description | Priority |
|------|-------------|----------|
| **Error handling standardization** | API error responses need consistent codes and messages across all endpoints | Medium |
| **Rate limit handling** | The GitHub API client needs retry logic with exponential backoff for rate-limited responses | High |
| **Database migration tooling** | Current manual migration steps should be automated into the startup sequence | Low |
| **Frontend error boundaries** | React error boundaries need to be added to prevent full-page crashes on component failures | Medium |

## Evaluation and Quality

The following work items focus on measuring and improving the quality of retrieval and generation:

| Item | Description |
|------|-------------|
| **Benchmark dataset** | Build a curated set of 50+ questions with verified answers across 5 representative repositories |
| **Retrieval precision tracking** | Log retrieval results and measure whether the correct chunks appear in the top-8 |
| **Citation accuracy audit** | Automated checks that every citation in a response maps to a real file and line range |
| **Response groundedness scoring** | Use an LLM-as-judge approach to score whether each claim in a response is supported by the cited sources |

## Scaling Considerations

For deployments serving multiple teams or organizations:

| Concern | Current Limitation | Planned Mitigation |
|---------|-------------------|-------------------|
| **Ingestion throughput** | Single-process ingestion limits concurrent repository indexing | Background task queue with worker pool |
| **Vector search latency** | pgvector HNSW index performance degrades above 1M chunks | Partition embeddings by repository_id with per-partition indexes |
| **Storage cost** | 1536-dimensional vectors at 4 bytes each consume ~6KB per chunk | Evaluate dimension reduction (Matryoshka embeddings) for large deployments |
| **LLM cost** | Each query generates an API call to OpenAI | Cache frequent query patterns with semantic similarity matching |

## Future Integrations

Planned integrations that extend RepoLens's capabilities:

| Integration | Purpose |
|-------------|---------|
| **GitLab and Bitbucket** | Support repositories hosted on platforms beyond GitHub |
| **IDE extensions** | VS Code and JetBrains plugins that query RepoLens from within the editor |
| **Slack and Teams** | Bot interface for asking codebase questions from chat platforms |
| **CI/CD integration** | Automated code review suggestions based on repository context |
| **Custom LLM providers** | Support for self-hosted models (Llama, Mistral) via OpenAI-compatible APIs |
