#!/bin/bash

# Deployment script for markdown-server
# This script is triggered by the webhook when a push to main branch occurs

set -e

echo "=== Starting deployment at $(date) ==="

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "ERROR: Not in a git repository. /repo should be mounted from the host."
    echo "Current directory: $(pwd)"
    ls -la
    exit 1
fi

# Configure git to use GitHub PAT for authentication
# Use repository-local config to avoid permission issues with global config
if [ -n "$GITHUB_PAT" ]; then
    echo "Configuring git with GitHub PAT..."
    git config credential.helper "store --file=/config/.git-credentials"
    echo "https://${GITHUB_PAT}@github.com" > /config/.git-credentials
    chmod 600 /config/.git-credentials
else
    echo "Warning: GITHUB_PAT not set, attempting unauthenticated pull..."
fi

# Pull the latest changes
echo "Pulling latest changes from GitHub..."
git pull origin main

echo "Stopping and removing old markdown-server container..."
docker compose -f /repo/docker-compose.yml stop markdown-server
docker compose -f /repo/docker-compose.yml rm -f markdown-server

echo "Building new markdown-server image..."
docker compose -f /repo/docker-compose.yml build markdown-server

echo "Starting markdown-server container..."
docker compose -f /repo/docker-compose.yml up -d markdown-server

echo "Cleaning up old Docker images..."
docker image prune -f

echo "=== Deployment completed successfully at $(date) ==="
