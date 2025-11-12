# This Dockerfile should be run from the repository root
# Build command: docker build -f markdown-server/Dockerfile -t component-wiki .

# Build stage for frontend
FROM node:20-slim as frontend-builder

WORKDIR /app/markdown-server

# Copy frontend dependencies and install them
COPY markdown-server/package.json markdown-server/package-lock.json* ./
RUN npm install

# Copy frontend source files AND templates (needed for PurgeCSS)
COPY markdown-server/src/ ./src/
COPY markdown-server/templates/ ./templates/
COPY markdown-server/vite.config.js ./
RUN npm run build

# Content compilation stage
FROM python:3.13-slim as content-builder

WORKDIR /app

# Copy content schema and source files
COPY content/ ./content/
COPY markdown-server/compile_content.py ./markdown-server/

# Compile content into markdown-server/content
RUN python markdown-server/compile_content.py

# Production stage with Python
FROM python:3.13-slim

WORKDIR /app

# Copy Python dependencies and install them
COPY markdown-server/pyproject.toml .
RUN pip install --no-cache-dir .

# Copy built frontend components from build stage
COPY --from=frontend-builder /app/markdown-server/static/ ./static/

# Copy compiled content from content-builder stage
COPY --from=content-builder /app/markdown-server/content/ ./content/

# Copy Python application files
COPY markdown-server/main.py ./
COPY markdown-server/templates/ ./templates/
COPY content/content-schema.json ../content/

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]