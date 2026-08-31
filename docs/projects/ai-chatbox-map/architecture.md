# System Architecture

The AI Chatbox Map is split into a **React frontend**, a **FastAPI backend**, and external providers (Gemini and Mapbox). The backend is organized into clean layers: route handlers, schemas, services, and providers.

## High-Level Diagram

```
User Browser
     │  HTTPS
     ▼
React SPA (nginx, port 3000)
     │  /api/* proxied to backend
     ▼
FastAPI Backend (port 8000)
     │
     ├─► Gemini (intent extraction, response generation)
     ├─► Mapbox (place search, routing, reverse geocode)
     └─► session_memory.json (JSON persistence)
```

## Pipeline Flow

```
User Query
  → Intent Extraction (Gemini)
  → Query Rewriting
  → Place Search (Mapbox)
  → Ranking
  → Route (if needed, Mapbox)
  → Response Generation (Gemini)
  → Memory Update
```

## Backend Structure

```
backend/
├── main.py                    # FastAPI entry + middleware
├── api/                      # Route handlers
│   ├── routes_chat.py        # POST /api/chat
│   └── routes_health.py      # GET /health
├── schemas/                  # Pydantic models
│   ├── chat.py               # ChatRequest, ChatResponse
│   ├── places.py             # PlaceResult, RouteResult, Location
│   └── session.py            # SessionMemory, SessionSearchContext
├── services/                 # Business logic
│   ├── orchestrator.py       # Main pipeline coordinator
│   ├── intent_service.py     # Intent extraction
│   ├── memory_service.py     # Session memory (JSON persistence)
│   ├── place_search_service.py
│   ├── ranking_service.py
│   ├── route_service.py
│   └── response_service.py
├── providers/                # External API wrappers
│   ├── gemini_provider.py
│   └── mapbox_provider.py
└── utils/
    ├── config.py
    └── polyline.py
```

## Frontend Structure

```
frontend/                     # React SPA (port 3000, served by nginx)
├── src/
│   ├── App.jsx               # Main app (chat, map, directions)
│   ├── hooks/useGeolocation  # Browser geolocation hook
│   └── ...
├── nginx.conf                # Serves static + proxies /api → backend:8000
└── Dockerfile
```

## Design Principles

- **Thin route handlers** - business logic lives in services, not routes
- **Type hints everywhere** - Pydantic models shared across the app
- **Provider abstraction** - Gemini/Mapbox wrappers are swappable
- **Redis-ready memory** - `MemoryService` is designed so a `RedisMemoryService` can implement the same interface
- **No MySQL** - conversational memory uses JSON file persistence
