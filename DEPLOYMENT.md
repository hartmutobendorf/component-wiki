# Deployment Webhook System

This repository includes an automated deployment system using GitHub webhooks and Docker Compose.

## Architecture

The deployment system consists of three services:

1. **nginx** - Reverse proxy routing traffic to the appropriate service
2. **webhook** - Listens for GitHub webhook events and triggers deployments
3. **markdown-server** - The main application serving the component wiki

## Setup Instructions

### 1. Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` and set:

-   `WEBHOOK_SECRET`: A secure random token for webhook authentication (generate with `openssl rand -hex 32`)
-   `GITHUB_PAT`: Your GitHub Personal Access Token for authenticated git operations
    -   Create a PAT at https://github.com/settings/tokens
    -   For classic tokens: Select `repo` scope (or `public_repo` for public repositories only)
    -   For fine-grained tokens: Grant read access to repository contents
-   `GITHUB_REPO`: Your GitHub repository URL (default: https://github.com/dgtlntv/component-wiki.git)

### 2. Configure GitHub Webhook

1. Go to your GitHub repository settings
2. Navigate to "Webhooks" → "Add webhook"
3. Set the payload URL to: `http://webhook.example.com/hooks/redeploy-markdown-server`
4. Set Content type to: `application/json`
5. Set the secret to the same value as `WEBHOOK_SECRET` in your `.env` file
6. Select "Just the push event"
7. Ensure "Active" is checked
8. Save the webhook

### 3. Update DNS Records

Point your domain DNS records to your server:

-   `example.com` → Your server IP (for the main application)
-   `webhook.example.com` → Your server IP (for the webhook endpoint)

Update the domain names in `nginx/nginx.conf` to match your actual domains.

### 4. Deploy the Stack

```bash
docker compose up -d
```

This will start all three services:

-   nginx on port 80
-   webhook on port 9000 (internal)
-   markdown-server on port 8000 (internal)

### 5. Initial Repository Clone

The webhook service needs access to the repository. For the first time, you may need to clone it:

```bash
git clone ${GITHUB_REPO} /path/to/repo
```

Or ensure the repository is already present at the location mounted in the webhook container.

## How It Works

1. When code is pushed to the `main` branch of your GitHub repository, GitHub sends a webhook event
2. The webhook service validates the request using HMAC-SHA256 signature verification
3. If valid, it executes the deployment script which:
    - Configures git authentication using the GitHub PAT
    - Pulls the latest code from GitHub
    - Rebuilds the markdown-server Docker image
    - Stops and removes the old container
    - Starts the new container
    - Cleans up old Docker images

## Security Notes

-   The webhook uses HMAC-SHA256 signature verification to ensure requests come from GitHub
-   Keep your `WEBHOOK_SECRET` and `GITHUB_PAT` secure and never commit them to version control
-   The GitHub PAT is used for authenticated git operations to avoid rate limiting and access private repositories
-   The webhook service has access to the Docker socket, which is necessary for container management
-   Consider adding SSL/TLS certificates for HTTPS support using Let's Encrypt
-   Rotate your GitHub PAT periodically for better security

## Monitoring

View logs for each service:

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f webhook
docker compose logs -f markdown-server
docker compose logs -f nginx
```

## Troubleshooting

If deployments aren't triggering:

1. Check webhook delivery status in GitHub (Settings → Webhooks → Recent Deliveries)
2. Verify the `WEBHOOK_SECRET` matches between GitHub and your `.env` file
3. Check webhook logs: `docker compose logs webhook`
4. Ensure the webhook endpoint is accessible from the internet
5. Verify DNS records are correctly pointing to your server
