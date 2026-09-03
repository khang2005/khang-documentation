# Deployment

RepoLens deploys locally with Docker Compose and in production on a K3s cluster. This section covers both deployment modes, along with security considerations.

## Docker Compose (Local Development)

The `docker-compose.yml` file runs the full stack locally with a single command.

### Services

```yaml
# docker-compose.yml
services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_USER: repolens
      POSTGRES_PASSWORD: repolens
      POSTGRES_DB: repolens
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U repolens"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql+asyncpg://repolens:repolens@postgres:5432/repolens
      GITHUB_TOKEN: ${GITHUB_TOKEN}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      CORS_ORIGINS: http://localhost:5173
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./backend/app:/app/app

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      VITE_API_BASE_URL: http://localhost:8000
    ports:
      - "5173:5173"
    depends_on:
      - backend
    volumes:
      - ./frontend/src:/app/src

volumes:
  pgdata:
```

### Running Locally

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your tokens
# Start all services
docker compose up -d

# View logs
docker compose logs -f backend

# Run database migrations
docker compose exec backend alembic upgrade head

# Stop services
docker compose down
```

### Production Override

The `docker-compose.prod.yml` override file adjusts settings for production-like local testing:

```yaml
# docker-compose.prod.yml
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: production
    environment:
      DATABASE_URL: postgresql+asyncpg://repolens:repolens@postgres:5432/repolens
      GITHUB_TOKEN: ${GITHUB_TOKEN}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      CORS_ORIGINS: https://repolens.yourdomain.com
      LOG_LEVEL: WARNING
    ports: []

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: production
    ports: []

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/nginx/certs:/etc/nginx/certs:ro
    depends_on:
      - backend
      - frontend
```

## K3s Production Deployment

K3s is a lightweight Kubernetes distribution designed for resource-constrained environments. RepoLens deploys to K3s with manifests in the `k8s/` directory.

### Cluster Topology

```mermaid
flowchart TB
    subgraph K3s Cluster
        subgraph "Application Layer"
            B[Backend Deployment<br/>Replicas: 2<br/>FastAPI + Uvicorn]
            F[Frontend Deployment<br/>Replicas: 2<br/>Nginx + Static Build]
        end
        subgraph "Data Layer"
            P[PostgreSQL StatefulSet<br/>Replicas: 1<br/>pgvector/pgvector:pg16]
        end
        subgraph "Networking"
            S[Service: Backend<br/>ClusterIP :8000]
            SF[Service: Frontend<br/>ClusterIP :80]
        end
    end

    I[Ingress Controller] --> SF
    SF --> F
    I --> S
    S --> B
    B --> P
```

### K3s Manifests

**Namespace**

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: repolens
```

**Backend Deployment**

```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: repolens-backend
  namespace: repolens
spec:
  replicas: 2
  selector:
    matchLabels:
      app: repolens-backend
  template:
    metadata:
      labels:
        app: repolens-backend
    spec:
      containers:
        - name: backend
          image: registry.example.com/repolens-backend:latest
          ports:
            - containerPort: 8000
          envFrom:
            - configMapRef:
                name: repolens-config
            - secretRef:
                name: repolens-secrets
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /api/v1/health
              port: 8000
            initialDelaySeconds: 10
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /api/v1/health
              port: 8000
            initialDelaySeconds: 5
            periodSeconds: 10
```

**PostgreSQL StatefulSet**

```yaml
# k8s/postgres-statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: repolens-postgres
  namespace: repolens
spec:
  serviceName: repolens-postgres
  replicas: 1
  selector:
    matchLabels:
      app: repolens-postgres
  template:
    metadata:
      labels:
        app: repolens-postgres
    spec:
      containers:
        - name: postgres
          image: pgvector/pgvector:pg16
          ports:
            - containerPort: 5432
          env:
            - name: POSTGRES_USER
              valueFrom:
                secretKeyRef:
                  name: repolens-secrets
                  key: db-user
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: repolens-secrets
                  key: db-password
            - name: POSTGRES_DB
              value: repolens
          volumeMounts:
            - name: pgdata
              mountPath: /var/lib/postgresql/data
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "2Gi"
              cpu: "1000m"
  volumeClaimTemplates:
    - metadata:
        name: pgdata
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 10Gi
```

**ConfigMap and Secrets**

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: repolens-config
  namespace: repolens
data:
  EMBEDDING_MODEL: "text-embedding-3-small"
  GENERATION_MODEL: "gpt-4o"
  CHUNK_MIN_TOKENS: "200"
  CHUNK_MAX_TOKENS: "500"
  RETRIEVAL_TOP_K: "20"
  RETRIEVAL_TOP_N: "8"
  SIMILARITY_THRESHOLD: "0.3"
  DB_POOL_SIZE: "10"
  LOG_LEVEL: "INFO"

# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: repolens-secrets
  namespace: repolens
type: Opaque
stringData:
  db-user: repolens
  db-password: <production-password>
  GITHUB_TOKEN: <github-token>
  OPENAI_API_KEY: <openai-key>
```

### K3s Deployment Commands

```bash
# Apply all manifests
kubectl apply -f k8s/

# Check deployment status
kubectl -n repolens get pods
kubectl -n repolens get services

# View logs
kubectl -n repolens logs -l app=repolens-backend -f

# Scale backend
kubectl -n repolens scale deployment repolens-backend --replicas=4

# Database migration (run in a one-off pod)
kubectl -n repolens run migrate --rm -it \
  --image=registry.example.com/repolens-backend:latest \
  -- alembic upgrade head
```

## Security Considerations

### Secrets Management

- All API keys and database credentials are stored in Kubernetes Secrets, not in ConfigMaps or source code
- Secrets are referenced via `secretKeyRef` in pod specifications
- Docker Compose uses `.env` files, which are excluded from version control via `.gitignore`
- In production, consider integrating with a secrets manager (Vault, AWS Secrets Manager, or Sealed Secrets)

### Network Security

- The frontend and backend communicate over the internal cluster network, not the public internet
- PostgreSQL is not exposed externally — only the backend service connects to it
- The Ingress controller handles TLS termination and routes traffic to the appropriate service
- CORS is restricted to specific origins, not `*`

### Authentication and Authorization

- The GitHub token is transmitted over HTTPS and stored server-side only
- The OpenAI API key is never sent to the frontend
- In the current implementation, there is no user authentication on the RepoLens API itself. For multi-tenant deployments, adding API key or OAuth authentication is a planned enhancement

### Container Security

- Dockerfiles use multi-stage builds to minimize the final image size and exclude build dependencies
- Production images run as non-root users
- Container images are scanned for vulnerabilities as part of the CI/CD pipeline
- Resource limits are set on all containers to prevent resource exhaustion

### Database Security

- PostgreSQL connections use the `asyncpg` driver with SSL when the `DATABASE_URL` includes SSL parameters
- Database passwords are rotated as part of the secrets management process
- The pgvector extension is installed as a trusted extension, limiting its access scope
