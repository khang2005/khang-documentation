# Session Memory

The AI Chatbox Map maintains **conversational memory** per session so follow-up queries work naturally. Memory is stored as JSON at `backend/data/session_memory.json` with a Redis-ready interface.

## Follow-up Modes

When the intent service processes a query, it classifies whether the query is a follow-up and, if so, which mode:

| Mode | Meaning | Example |
|------|---------|---------|
| `select` | User selects a previous result | "the second one" |
| `refine` | User refines current results | "is it open now", "closer one" |
| `replace_search` | User starts a new search (not a follow-up) | "how about a market" |
| `none` | Fresh / general query | "coffee nearby" |

## Behavior

- **Category switches** (market, mall, cafe, etc.) trigger fresh searches
- **Explicit references** ("the second one", "navigate there") reuse previous results
- **Routes are cleared** on replacement searches
- **Search context** (last results, filters, origin) drives the rewriter

## Data Model

`schema` (`schemas/session.py`):

```python
class SessionMemory:
    session_id: str
    last_user_query: Optional[str]
    last_intent: Optional[dict]
    last_results: Optional[list]
    selected_place: Optional[dict]
    current_route: Optional[dict]
    last_origin: Optional[dict]           # {lat, lng}
    search_context: SessionSearchContext
    conversation_history: list
    created_at: float
    updated_at: float
```

## Decision Logic

The orchestrator decides whether to reuse previous results using a set of heuristics:

- If a natural-language reference anaphora is detected → look up previous results
- If the query looks like a **replacement search** (category switch) → clear prior results and route
- Otherwise → perform a fresh search

## Persistence

- Stored at `backend/data/session_memory.json`
- `_load()` is resilient: it skips corrupted entries and missing `session_id` keys
- Designed so a future `RedisMemoryService` can implement the same `MemoryService` interface

## Session ID

The frontend currently sends a fixed `session_id: "default"` (single-user demo). The backend supports per-user sessions via the `session_id` request field.
