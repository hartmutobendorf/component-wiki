FROM ghcr.io/linuxserver-labs/webhook:latest

# Install git and docker-cli for deployment operations
RUN apk add --no-cache git docker-cli docker-cli-compose

# Create directory for the repository
RUN mkdir -p /repo

# Copy deployment script
COPY deploy.sh /config/deploy.sh
RUN chmod +x /config/deploy.sh

# Copy hooks configuration
COPY hooks.json /config/hooks.json
