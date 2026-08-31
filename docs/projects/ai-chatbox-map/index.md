# AI Chatbox Map

An AI-powered chatbot with an interactive map for location-based queries and directions, powered by **Google Gemini** for natural language understanding and **Mapbox** for place search and routing.

## Overview

The AI Chatbox Map lets users ask conversational questions about places and directions — for example *"coffee nearby"*, *"navigate me to starbucks"*, or *"where am i"* — and get a friendly natural-language answer with places shown on an interactive Leaflet map and optional turn-by-turn directions.

### Key Features

- **AI Chatbot** - Gemini-powered conversational assistant with intent extraction
- **Interactive Map** - Leaflet map with OpenStreetMap tiles
- **Place Search** - Find places by query or proximity via Mapbox
- **Routing** - Get turn-by-turn directions between locations
- **Session Memory** - Context-aware follow-up queries ("the second one", "navigate there")
- **Dockerized** - Frontend (nginx) and backend (FastAPI) run as containers

### Tech Stack

- **Frontend**: React, Leaflet
- **Backend**: FastAPI, Python
- **AI**: Google Gemini (Gemini Flash)
- **Maps**: Mapbox, OpenStreetMap tiles

---

## Explore

- **[System Architecture](architecture.md)** - High-level design and component breakdown
- **[Session Memory](session-memory.md)** - How conversational follow-up context works
- **[Deployment](deployment.md)** - Local and Docker setup, and cloud options
- **[Provider Comparison](provider-comparison.md)** - Gemini vs Groq evaluation
- **[Example Queries](index.md#example-queries)** - Common questions you can ask

---

## Example Queries

- "where am i" - Reverse geocode current location
- "coffee nearby" - Find local coffee shops
- "navigate me to starbucks" - Get route to destination
- "the second one" - Select from previous results
- "how about a market" - Fresh search (category switch)
- "is it open now" - Refine (follow-up on current results)
