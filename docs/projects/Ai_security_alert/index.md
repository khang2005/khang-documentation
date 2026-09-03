# AI Log Triage and Automated Alerting System

A production-ready, runnable project that ingests error logs, groups related failures into incidents, enriches them with context, produces evidence-backed AI triage, and sends structured alerts to Slack, Microsoft Teams, or email — updating an existing alert thread when the same incident recurs.

> **Core principle:** *AI proposes the diagnosis and remediation guidance; deterministic policies control severity, routing, paging, access, and production actions.*

![AI Log Triage and Automated Alerting architecture](images/Flowchart.png)

*Figure 1. AI-assisted log triage and automated alerting architecture.*

---

## Quick Start

The fastest way to see the system running end-to-end:

```bash
# 1. Clone and prepare
git clone <your-repo-url> ai-log-triage
cd ai-log-triage

# 2. Configure environment
cp .env.example .env
# Edit .env: set DATABASE_URL and at least one notification channel + OPENAI_API_KEY

# 3. Start PostgreSQL and the API
docker compose up --build

# 4. Send a sample log and watch the incident get created + alert delivered
curl -X POST http://localhost:8000/logs \
  -H "Content-Type: application/json" \
  -d @sample_data/error_logs/db_timeout.json
```

That's it. In roughly a minute you have a running ingestion API, a SQLite/Postgres-backed store, deterministic incident grouping, and (optionally) an AI triage + Slack alert.

---

## What It Does

The system automates the full triage pipeline:

1. **Ingest** error logs from applications, APIs, containers, cloud platforms, and infrastructure.
2. **Normalize and redact** sensitive information from every log.
3. **Group** duplicate or related errors into a single incident.
4. **Enrich** incidents with deployments, metrics, traces, service ownership, runbooks, and similar past incidents.
5. **Triage with AI** to propose root-cause hypotheses with supporting evidence, confidence, impact, verification steps, and remediation suggestions.
6. **Alert** through Slack, Microsoft Teams, or email.
7. **Update** an existing alert thread when the same incident recurs instead of creating repeated messages.
8. **Collect feedback** from responders to improve future triage.

Expected benefits: **reduced alert noise**, **faster incident diagnosis**, **consistent alert formatting**, and **preserved engineering context** (the AI never invents an answer when evidence is missing).

---

## Repository Layout

```text
ai-log-triage/
├── README.md
├── requirements.txt
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   │
│   │   ├── routes/
│   │   │   ├── logs.py
│   │   │   ├── incidents.py
│   │   │   └── health.py
│   │   │
│   │   ├── services/
│   │   │   ├── redaction.py
│   │   │   ├── grouping.py
│   │   │   ├── retrieval.py
│   │   │   ├── ai_triage.py
│   │   │   ├── alert_policy.py
│   │   │   ├── slack_alert.py
│   │   │   └── email_alert.py
│   │   │
│   │   └── prompts/
│   │       └── triage_prompt.txt
│   │
│   └── tests/
│       ├── test_logs.py
│       ├── test_redaction.py
│       ├── test_grouping.py
│       ├── test_retrieval.py
│       └── test_ai_triage.py
│
├── database/
│   ├── schema.sql
│   └── seed_data.sql
│
├── sample_data/
│   ├── error_logs/
│   ├── runbooks/
│   └── resolved_incidents/
│
└── deployment/
    ├── aws/deployment-guide.md
    └── kubernetes/
        ├── deployment.yaml
        ├── service.yaml
        └── secret-example.yaml
```

A single, understandable monorepo — **not** split into microservice repositories.

---

## Requirements

### Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-1 | Accept error logs via a REST API endpoint. |
| FR-2 | Normalize logs into a standard event schema. |
| FR-3 | Redact secrets, tokens, and PII from logs. |
| FR-4 | Fingerprint and group duplicate or related logs into incidents. |
| FR-5 | Enrich incidents with runbook, ownership, deployment, metric, trace, and historical-incident context. |
| FR-6 | Generate structured AI triage with root-cause hypotheses and evidence. |
| FR-7 | Send structured alerts via Slack (primary), email (fallback), and Teams (optional). |
| FR-8 | Update an existing alert thread for recurring incidents. |
| FR-9 | Store incidents, logs, runbooks, notifications, and feedback. |
| FR-10 | Apply deterministic severity, routing, paging, and alert-throttling rules. |

### Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | Ingestion handles expected peak volume with bounded queue latency; AI analysis is asynchronous and never blocks ingestion. |
| **Availability** | A basic deterministic alert is always delivered even when AI analysis is unavailable. |
| **Security** | Secrets and PII redacted; role-based access control; tenant isolation; audit logging; encryption at rest and in transit. |
| **Reliability** | Recovers from queue backlogs, notification failures, and AI timeouts; duplicate events are deduplicated. |
| **Observability** | Metrics for volume, failures, queue latency, grouping, AI latency, notification delivery, and cost. |

---

## Goals and Non-Goals

### Goals

- Ingest and normalize error logs from multiple, heterogeneous sources.
- Redact secrets and PII.
- Group related errors into incidents with deterministic fingerprinting.
- Enrich incidents with deployment, metrics, traces, ownership, runbook, and historical context.
- Produce structured, evidence-backed AI triage with confidence scoring.
- Deliver structured alerts and update threads on recurrence.
- Capture responder feedback and use it to improve future triage.

### Non-Goals (MVP)

- The MVP **does not** automatically modify, restart, roll back, or deploy production systems.
- Human approval is always required for any remediation action.
- No advanced semantic vector search (pgvector is optional only if needed).

---

## Prerequisites

| Tool | Version | Why |
|------|---------|-----|
| **Python** | 3.11+ | Backend and AI processing |
| **Docker** | 20.10+ | Containerization and local dev |
| **Docker Compose** | 2.x | Local orchestration |
| **PostgreSQL** | 14+ | Primary store (MySQL also supported) |
| **OpenAI API key** | — | AI triage (optional but recommended) |
| **Slack webhook URL** | — | Primary alert channel |

Install on macOS:

```bash
brew install python@3.11 docker docker-compose
```

Install on Ubuntu/Debian:

```bash
sudo apt update
sudo apt install -y python3.11 python3.11-venv docker.io docker-compose-plugin
```

---

## Installation and Setup

### 1. Create a virtual environment and install dependencies

```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

`requirements.txt`:

```text
fastapi==0.115.*
uvicorn[standard]==0.30.*
pydantic==2.9.*
sqlalchemy==2.0.*
psycopg2-binary==2.9.*
httpx==0.27.*
python-dotenv==1.0.*
openai==1.54.*
pytest==8.3.*
pytest-asyncio==0.24.*
```

### 2. Configure the environment

```bash
cp .env.example .env
```

`.env.example`:

```text
# Application
APP_ENV=development
SECRET_KEY=change-me

# Database (PostgreSQL default; MySQL also supported)
DATABASE_URL=postgresql+psycopg2://triage:triage@localhost:5432/triage
# MySQL alternative:
# DATABASE_URL=mysql+pymysql://triage:triage@localhost:3306/triage

# AI
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini

# Notifications
SLACK_WEBHOOK_URL=
SMTP_HOST=
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM=alerts@example.com
```

### 3. Initialize the database schema

```bash
psql "$DATABASE_URL" -f database/schema.sql
# or, with SQLAlchemy:
python -m app.database create
```

---

## Running the API

### Option A — Local (no Docker)

```bash
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### Option B — Docker Compose (recommended)

```bash
docker compose up --build
```

`docker-compose.yml`:

```yaml
services:
  db:
    image: postgres:14
    environment:
      POSTGRES_USER: triage
      POSTGRES_PASSWORD: triage
      POSTGRES_DB: triage
    ports:
      - "5432:5432"
    volumes:
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U triage"]
      interval: 5s
      retries: 5

  api:
    build: .
    env_file: .env
    environment:
      DATABASE_URL: postgresql+psycopg2://triage:triage@db:5432/triage
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000
```

`Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend
WORKDIR /app/backend

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Verify it's up

```bash
curl http://localhost:8000/health
# {"status":"ok","version":"1.0.0"}
```

---

## Using the API

### Health check

```bash
curl http://localhost:8000/health
```

### Ingest a log

```bash
curl -X POST http://localhost:8000/logs \
  -H "Content-Type: application/json" \
  -d '{
    "source": "api-gateway",
    "service_name": "checkout",
    "environment": "prod",
    "region": "us-east-1",
    "log_level": "error",
    "error_type": "DatabaseConnectionError",
    "message": "connection to database timed out after 5s; retrying...",
    "metadata": {"trace_id": "abc-123", "request_id": "req-456"}
  }'
```

Response (201 Created):

```json
{
  "event_id": "9f8b3c2d-...",
  "timestamp": "2026-09-02T23:00:00Z",
  "fingerprint": "checkout|DatabaseConnectionError|db connectivity",
  "incident_id": null,
  "redacted": false,
  "sensitive_fields_removed": []
}
```

### Query incidents

```bash
curl "http://localhost:8000/incidents?status=open&limit=10"
```

### Record responder feedback

```bash
curl -X POST http://localhost:8000/incidents/{incident_id}/feedback \
  -H "Content-Type: application/json" \
  -d '{"useful": true, "root_cause": "db_pool_exhausted", "comment": "AI suggestion was accurate"}'
```

---

## Architecture

The system uses **Python**, **FastAPI**, **PostgreSQL (or MySQL)**, the **OpenAI API**, and **Slack/email** to convert incoming error logs into grouped incidents and evidence-based triage alerts. Async work runs in FastAPI background tasks or a simple Python worker process, backed by the database for queued jobs.

### Component Responsibilities

#### Log sources
Applications, APIs, containers, cloud platforms, and infrastructure emit error logs in various formats. Sources push logs to the ingestion endpoint, optionally with basic deployment metadata.

#### Ingestion service
A FastAPI REST endpoint accepts raw logs, performs initial validation, and normalizes them into a standard event schema.

#### Message queue / event bus
The MVP avoids Kafka and RabbitMQ. Asynchronous processing uses **FastAPI background tasks** or a **simple Python worker process**, with queued jobs stored in the database.

#### Log normalization and secret-redaction service
Normalizes timestamps, fields, and formats; redacts secrets, tokens, keys, and PII before the log is stored or sent to the AI.

#### Incident fingerprinting and grouping engine
Computes a deterministic fingerprint from service name, error type, surrounding context, and keywords; groups matching fingerprints within a time window into a single incident.

#### Context-enrichment service
Pulls related context: recent deployments, metrics, traces, service ownership, runbook references, and previously resolved incidents.

#### Runbook and historical-incident retrieval system
Performs direct keyword search over runbooks and resolved incidents stored in PostgreSQL (or MySQL). pgvector is optional if semantic search is later needed.

#### AI triage engine
Sends the evidence package to the OpenAI API and requests structured JSON output. The model proposes ranked root-cause hypotheses with confidence, evidence, verification steps, and remediation suggestions, citing supporting evidence for every claim.

#### Safety and policy gate
Deterministic policies control severity, routing, paging, access, and production actions. The AI may propose; the gate decides and enforces.

#### Slack, Teams, and email notification service
Sends structured alerts via Slack incoming webhook (primary), Python SMTP email (fallback), and Teams webhook (optional).

#### Incident tracking and responder-feedback system
Tracks incidents, updates alert threads on recurrence, and collects responder feedback to improve future triage.

#### Storage, search, monitoring, and audit services
Stores logs, incidents, runbooks, resolved incidents, notifications, and feedback; records an audit trail of AI outputs and decisions.

### Async worker sketch

```python
# backend/app/main.py
from fastapi import FastAPI
from app.routes import logs, incidents, health

app = FastAPI(title="AI Log Triage")
app.include_router(health.router)
app.include_router(logs.router)
app.include_router(incidents.router)
```

```python
# backend/app/services/grouping.py
import hashlib

def fingerprint(service_name: str, error_type: str, context: str) -> str:
    raw = f"{service_name}|{error_type}|{normalize(context)}"
    return hashlib.sha256(raw.encode()).hexdigest()[:24]
```

### Data model

```python
# backend/app/models.py
from sqlalchemy import (
    Column, String, Text, DateTime, Integer, Boolean, func, JSON
)
from app.database import Base

class LogEvent(Base):
    __tablename__ = "logs"
    event_id = Column(String, primary_key=True)
    service_name = Column(String, index=True)
    fingerprint = Column(String, index=True)
    message = Column(Text)
    metadata = Column(JSON)            # JSONB when using PostgreSQL
    received_at = Column(DateTime, server_default=func.now())

class Incident(Base):
    __tablename__ = "incidents"
    incident_id = Column(String, primary_key=True)
    fingerprint = Column(String, index=True)
    count = Column(Integer, default=1)
    status = Column(String, default="open")
    thread_ts = Column(String, nullable=True)  # Slack thread timestamp
```

---

## Data Design

### Normalized Log Event

| Field | Type | Description |
|-------|------|-------------|
| `event_id` | UUID | Unique event identifier |
| `timestamp` | Datetime | Time the event occurred |
| `source` | String | Application, API, container, cloud, or infrastructure |
| `service_name` | String | Owning service |
| `environment` | String | e.g. `prod`, `staging` |
| `region` | String | Deployment region |
| `log_level` | String | `error`, `warning`, etc. |
| `error_type` | String | Normalized error type |
| `message` | Text | Sanitized log message |
| `fingerprint` | String | Grouping key for incident identity |
| `metadata` | JSONB/JSON | Variable attributes (trace id, request id, etc.) |

### AI Triage Output

The structured AI triage result includes:

- **Incident ID** and **Summary**
- **Severity**, **impacted service** and **environment**
- **Occurrence count** and **time window**
- **Ranked root-cause hypotheses**, each with **confidence**
- **Evidence** supporting each hypothesis
- **Information that contradicts** each hypothesis
- **Verification steps**
- **Recommended remediation actions** with **risk level** each
- **Runbook references**
- **Missing information** and **owning team**
- **Escalation recommendation**
- **Model and prompt-version metadata**

Validated with Pydantic:

```python
# backend/app/schemas.py
from pydantic import BaseModel, Field

class Hypothesis(BaseModel):
    summary: str
    confidence: float = Field(ge=0, le=1)
    evidence: list[str]
    contradictions: list[str] = []

class TriageResult(BaseModel):
    incident_id: str
    summary: str
    severity: str
    hypotheses: list[Hypothesis]
    verification_steps: list[str]
    remediation_actions: list[str]
    missing_information: list[str]
    model: str
    prompt_version: str
```

---

## AI and RAG Design

The MVP implements retrieval-augmented generation (RAG) directly, without LangChain or LlamaIndex:

1. Receive and sanitize an error log.
2. Extract its service name, error type, keywords, and fingerprint.
3. Query PostgreSQL (or MySQL) for related runbooks and previously resolved incidents using keyword search.
4. Combine the retrieved context with the current error into an evidence package.
5. Send the evidence package to the OpenAI API.
6. Require structured JSON output.
7. Validate the output using Pydantic.
8. Reject or downgrade claims that do not contain supporting evidence.

Every root-cause hypothesis must reference supporting evidence. The model must explicitly state when evidence is insufficient rather than inventing an answer. Unsupported claims are rejected or downgraded by the validation layer.

### Worked example

Input error:

```
service=checkout  error_type=DatabaseConnectionError
message="connection to database timed out after 5s"
```

Retrieved context:

- Runbook `database-connectivity.md`: "Check DB pool exhaustion; verify max_connections; check recent deploys."
- Previous incident `INC-142` (resolved): root cause = DB connection pool exhausted after a deploy increased traffic 3x.

AI triage output (abbreviated):

```json
{
  "incident_id": "INC-143",
  "summary": "DB connection timeouts on checkout in prod",
  "severity": "high",
  "hypotheses": [
    {
      "summary": "Database connection pool exhausted after traffic spike",
      "confidence": 0.82,
      "evidence": ["timed out after 5s", "matches INC-142 signature"],
      "contradictions": []
    }
  ],
  "verification_steps": ["Check pg_stat_activity for active connections", "Compare to INC-142"],
  "remediation_actions": ["Increase pool size; scale read replicas - requires human approval"],
  "missing_information": ["Current max_connections setting", "Replica status"],
  "model": "gpt-4o-mini",
  "prompt_version": "triage_v3"
}
```

---

## Incident Grouping and Severity Logic

- **Fingerprinting:** deterministic hash of service name, error type, and normalized context.
- **Deduplication:** identical fingerprints within a time window collapse into one incident.
- **Time windows:** an incident groups events that occur within a configurable window and stays open until a silent period.
- **Severity rules:** deterministic thresholds based on service criticality, environment, occurrence count, and user impact.
- **Alert thresholds and rate limiting:** alerts are suppressed or throttled above configured rates.
- **Incident-thread updates:** a recurring incident updates the existing alert thread rather than sending a new message.

Severity and paging are controlled by **deterministic rules**, never by AI alone.

---

## Alert Format

### Example Slack alert

A recurring incident updates the existing thread rather than opening a new one.

```text
🔴 [HIGH] DB connection timeouts - checkout (prod/us-east-1)
Started: 2026-09-02T23:00:00Z · Occurrences: 34 · Window: 12 min

Checkout service is experiencing database connection timeouts in production.

Likely root cause: DB connection pool exhausted after traffic spike (confidence 0.82)

Evidence:
• Connection timeout after 5s × 34 occurrences
• Matches resolved incident INC-142

Verification:
1. Check pg_stat_activity for active connections
2. Compare deployment time to incident start

Safe remediation (requires human approval):
• Increase DB pool size
• Scale read replicas

Owner: @payments-oncall   Runbook: database-connectivity.md
Logs: <link>  Dashboard: <link>  Traces: <link>  Incident: INC-143
```

---

## Security and Safety

- **Secret and PII redaction** before storage or AI processing.
- **Prompt-injection protection** on untrusted log content.
- **Role-based access control** for dashboards and APIs.
- **Tenant isolation** for multi-tenant environments.
- **Audit logging** of AI outputs and policy decisions.
- **Data retention** policies for logs and incidents.
- **Encryption** at rest and in transit.
- **Model access restrictions** and credential management via a secrets manager (e.g. AWS Secrets Manager).
- **Human approval** is required for any remediation action.

### Redaction example

```python
# backend/app/services/redaction.py
import re

SECRET_PATTERNS = [
    (re.compile(r"\b[A-Za-z0-9_\-]{20,}\b"), "<REDACTED>"),   # tokens / keys
    (re.compile(r"\bAKIA[0-9A-Z]{16}\b"), "<AWS_KEY>"),
    (re.compile(r"password[=: ]+\S+", re.I), "password=<REDACTED>"),
]

def redact(text: str) -> str:
    for pattern, replacement in SECRET_PATTERNS:
        text = pattern.sub(replacement, text)
    return text
```

---

## Failure Handling

| Failure | Behavior |
|---------|----------|
| Model timeout | Continue with deterministic alert; mark AI analysis as pending/unavailable. |
| Invalid AI response | Reject, retry once, then fall back to deterministic alert. |
| Notification failure | Retry, then escalate to fallback channel (email). |
| Queue backlog | Bound the queue; ingestion remains non-blocking. |
| Duplicate events | Deduplicate via fingerprinting. |
| Unavailable knowledge sources | Retrieve what is available; flag missing context. |
| Excessive alert volume | Apply rate limiting and suppression. |

The system **always** sends a basic deterministic alert when AI analysis is unavailable.

---

## Observability

Track metrics for:

- Ingestion volume
- Processing failures
- Queue latency
- Grouping effectiveness
- AI latency
- Notification delivery
- False-positive rate
- Triage usefulness
- Token usage
- Cost per incident

Expose a `/metrics` endpoint and ship structured logs to your monitoring platform.

---

## Testing

```bash
source .venv/bin/activate
pytest -q
```

```bash
# Run a single service's tests
pytest backend/tests/test_grouping.py -q
```

- **Unit tests** for redaction, grouping, retrieval, and validation.
- **Integration tests** for the ingestion-to-alert pipeline.
- **Security tests** for redaction and prompt-injection resistance.
- **Adversarial tests** for malformed or malicious logs.
- **Resilience tests** for AI timeouts and notification failures.
- **Load tests** for queue behavior under peak volume.
- **Human evaluation** of triage accuracy and remediation usefulness.

Use a historical **golden dataset** of resolved incidents to measure root-cause accuracy and remediation usefulness.

---

## CI/CD and Deployment

### GitHub Actions (example)

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r requirements.txt
      - run: pytest -q
```

### Docker deployment

```bash
# Build and push the image
docker build -t registry.example.com/ai-log-triage:latest .
docker push registry.example.com/ai-log-triage:latest
```

### Optional Kubernetes

`deployment/kubernetes/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-log-triage
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ai-log-triage
  template:
    metadata:
      labels:
        app: ai-log-triage
    spec:
      containers:
        - name: api
          image: registry.example.com/ai-log-triage:latest
          ports:
            - containerPort: 8000
          envFrom:
            - secretRef:
                name: ai-log-triage-secrets
          resources:
            requests: { cpu: "250m", memory: "512Mi" }
            limits: { cpu: "1", memory: "1Gi" }
```

---

## Implementation Roadmap

1. **Discovery and requirements** — confirm sources, volume, retention, and channels.
2. **Deterministic ingestion and alerting MVP** — ingestion, redaction, grouping, and basic alerts.
3. **AI-assisted triage and RAG** — structured AI output, retrieval, and validation.
4. **Feedback, evaluation, and production hardening** — feedback loop, golden dataset, observability.
5. **Optional controlled automation** — only with humans in the loop.

## MVP Backlog

| Priority | Task | Dependency | Acceptance Criteria | Ownership |
|----------|------|-----------|--------------------|-----------|
| P0 | Log ingestion REST endpoint | — | Logs accepted and validated | Backend |
| P0 | Redaction service | — | Secrets and PII removed | Security |
| P0 | Grouping engine | Ingestion | Duplicates collapsed into incidents | Backend |
| P0 | Alert policy + Slack/email | Grouping | Deterministic alerts delivered | SRE |
| P1 | Context retrieval (runbooks/history) | Database schema | Relevant context returned | Backend |
| P1 | AI triage + Pydantic validation | Retrieval | Structured, evidence-backed output | AI |
| P1 | Incident tracking + thread updates | Grouping | Recurring incidents update thread | Backend |
| P2 | Feedback collection | Triage | Responder feedback stored | Product |
| P2 | Observability and audit | Core pipeline | Metrics and audit trail available | SRE |

---

## Risks and Design Decisions

### Risks

- **AI hallucination** — mitigated by evidence requirements and validation.
- **Prompt injection** via log content — mitigated by sanitization and isolation.
- **Alert fatigue** — mitigated by deterministic grouping and throttling.
- **Credential leakage** — mitigated by redaction and a secrets manager.

### Decisions Still to Be Made

- Cloud provider (AWS proposed) and region
- Logging platform integration
- Primary messaging channel (Slack proposed; Teams/email optional)
- Model provider (OpenAI proposed) and model version
- Knowledge sources and their refresh cadence
- Expected log volume and retention requirements
- Incident-management platform integration
- Database of record: **PostgreSQL** or **MySQL**

### Confirmed vs. Unresolved

- **Confirmed:** core architecture, RAG approach, deterministic policy gate, evidence-backed AI output.
- **Assumptions:** expected volumes, specific integrations, and ownership will be confirmed during discovery.
- **Recommended:** begin with a read-only system; do not propose autonomous production remediation for the MVP.
