# Khang Documentation

Documentation site built with MkDocs and hosted on Cloudflare R2 + Workers.

## Projects

- **Sensor Hub (Wireless Sensor Network)** - A distributed sensor system collecting, processing, and visualizing environmental data using wireless sensor nodes and an edge computing gateway.
- **AI Chatbox Map** - A conversational AI map assistant using Gemini for intent extraction and Mapbox for nearby place search.

## Local Development

```bash
pip install mkdocs-material mkdocs-mermaid2-plugin
mkdocs serve
```

Deploy worker:

```bash
cd worker
npm install
wrangler deploy
```

## Deployment

Automatic deployment via GitHub Actions on push to the master branch:

1. Build docs with MkDocs
2. Upload to R2
3. Deploy the Worker
