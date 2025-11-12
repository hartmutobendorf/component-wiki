FROM ghcr.io/linuxserver-labs/webhook:latest

# Install git and docker-cli for deployment operations
RUN apk add --no-cache git docker-cli docker-cli-compose

# Create directory for the repository
RUN mkdir -p /repo

# Create hooks directory (LinuxServer expects hooks in /config/hooks/)
RUN mkdir -p /config/hooks

# Copy deployment script
COPY deploy.sh /config/deploy.sh
RUN chmod +x /config/deploy.sh

# Copy hooks configuration to the correct location
COPY hooks.json /config/hooks/hooks.json
