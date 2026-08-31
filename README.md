# Khang Documentation

Documentation site built with MkDocs and hosted on Cloudflare R2 + Workers.

## Projects

- **Sensor Hub (Wireless Sensor Network)** - A distributed sensor system collecting, processing, and visualizing environmental data using wireless sensor nodes and an edge computing gateway.
- **AI Chatbox Map** - A conversational AI map assistant using Gemini for intent extraction and Mapbox for nearby place search.

## Project Structure

```
.
├── docs/                    # MkDocs source
│   └── projects/           # Project documentation
├── worker/                 # Cloudflare Worker
│   ├── src/index.ts       # Worker source
│   ├── wrangler.toml      # Worker config
│   └── package.json
├── mkdocs.yml             # MkDocs config
└── .github/workflows/     # CI/CD pipeline
```

## Local Development

### Build Documentation

```bash
pip install mkdocs-material mkdocs-mermaid2-plugin
mkdocs serve
```

### Deploy Worker

```bash
cd worker
npm install
wrangler deploy
```

## CI/CD Pipeline

The documentation is automatically deployed via GitHub Actions when changes are pushed to the master branch.

1. Build docs with MkDocs
2. Upload to R2 bucket
3. Deploy Cloudflare Worker

## License

MIT
