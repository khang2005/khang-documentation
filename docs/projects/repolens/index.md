# RepoLens

A RAG-Based Codebase Onboarding Assistant that helps developers understand unfamiliar codebases through natural-language queries grounded in actual source code, documentation, and repository history.

## The Problem

Developers spend significant time onboarding to new codebases. Reading through thousands of files, understanding project structure, and tracing how components connect takes days or weeks. Traditional documentation becomes stale, and institutional knowledge lives in the heads of senior engineers who are unavailable.

Existing code search tools return raw results without context. Copilot-style assistants generate plausible but ungrounded suggestions. Neither approach gives developers what they need: a reliable, cited answer drawn from the actual codebase.

## The Solution

RepoLens ingests a GitHub repository, indexes its source code, README files, technical documentation, commit history, and directory structure into a vector database. Developers ask natural-language questions through a React dashboard and receive grounded answers with file paths, line references, and source citations.

Every response traces back to specific chunks of code or documentation. If the system cannot find relevant context, it says so rather than guessing.

## Key Features

- **Repository Ingestion** — Automated ingestion of GitHub repositories via the GitHub API, including source code, documentation, and commit history
- **Code-Aware Chunking** — Language-aware splitting that respects function boundaries, class definitions, and file structure
- **Semantic Search** — Natural-language queries matched against embedded code and documentation chunks
- **Cited Responses** — Every answer includes file paths, line numbers, and source citations with hover previews
- **Hallucination Guardrails** — Retrieval-grounded generation with fallback responses when context is insufficient
- **Multi-Repository Support** — Index and query across multiple repositories
- **Conversational Context** — Follow-up questions reference prior conversation history
- **Dockerized Deployment** — Full stack runs locally with Docker Compose; deploys to K3s in production

---

## Explore

- **[System Architecture](architecture.md)** — Component diagram and design rationale
- **[RAG Workflow](rag-workflow.md)** — End-to-end pipeline from ingestion to response
- **[Repository Ingestion](ingestion.md)** — How code is parsed, chunked, and indexed
- **[Embedding & Storage](embedding-storage.md)** — Embedding generation and pgvector storage
- **[Retrieval & Generation](retrieval.md)** — Semantic search, reranking, and LLM response generation
- **[Citations & Hallucination](citations.md)** — File-level citations and grounding safeguards
- **[API Design](api-design.md)** — Backend endpoints, frontend components, and database schema
- **[Project Structure](project-structure.md)** — Recommended folder layout and environment variables
- **[Deployment](deployment.md)** — Docker Compose, K3s, and security configuration
- **[Testing Strategy](testing.md)** — Pytest suite, evaluation methodology, and CI/CD
- **[Setup & Usage](setup.md)** — Installation instructions and usage guide
- **[Roadmap](roadmap.md)** — Current development direction and planned enhancements
