#!/bin/sh
set -euo pipefail

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
readonly REPO_ROOT="${REPO_ROOT:-/repo}"
readonly LOG_FILE="${LOG_FILE:-/tmp/deployment.log}"
readonly LOCK_FILE="/tmp/deployment.lock"
readonly MAX_LOG_SIZE=10485760  # 10MB

# Logging functions
log() {
    level="$1"
    shift
    echo "$(date '+%Y-%m-%d %H:%M:%S') [$level] $*" | tee -a "$LOG_FILE"
}

log_info() { log "INFO" "$@"; }
log_warn() { log "WARN" "$@"; }
log_error() { log "ERROR" "$@"; }

# Cleanup function
cleanup() {
    exit_code=$?
    log_info "Cleaning up..."
    
    # Clear git credential cache
    git credential-cache exit 2>/dev/null || true
    
    # Remove lock file
    [ -f "$LOCK_FILE" ] && rm -f "$LOCK_FILE"
    
    # Rotate log if too large
    if [ -f "$LOG_FILE" ]; then
        log_size=$(stat -c%s "$LOG_FILE" 2>/dev/null || echo 0)
        if [ "$log_size" -gt $MAX_LOG_SIZE ]; then
            mv "$LOG_FILE" "${LOG_FILE}.old"
            touch "$LOG_FILE"
        fi
    fi
    
    exit $exit_code
}

# Set cleanup trap
trap cleanup EXIT

# Enhanced input validation
validate_inputs() {
    commit_id="$1"
    pusher_name="$2"
    payload="$3"
    
    # Validate commit ID format (basic git SHA validation)
    case "$commit_id" in
        unknown) ;;
        *) 
            echo "$commit_id" | grep -q '^[a-f0-9]\{7,40\}$' || {
                log_error "Invalid commit ID format: $commit_id"
                return 1
            }
            ;;
    esac
    
    # Validate pusher name (basic alphanumeric + common chars, no path traversal)
    case "$pusher_name" in
        unknown) ;;
        *..*)
            log_error "Invalid pusher name format: $pusher_name"
            return 1
            ;;
        *)
            echo "$pusher_name" | grep -qE '^[a-zA-Z0-9._\[\]-]+$' || {
                log_error "Invalid pusher name format: $pusher_name"
                return 1
            }
            ;;
    esac
    
    # Validate JSON payload
    if ! echo "$payload" | jq empty 2>/dev/null; then
        log_error "Invalid JSON payload"
        return 1
    fi
    
    return 0
}

# Enhanced lock mechanism
acquire_lock() {
    max_wait=30
    wait_time=0
    
    while [ $wait_time -lt $max_wait ]; do
        if [ -f "$LOCK_FILE" ]; then
            lock_pid=$(cat "$LOCK_FILE" 2>/dev/null || echo "unknown")
            if kill -0 "$lock_pid" 2>/dev/null; then
                log_info "Waiting for another deployment to complete (PID: $lock_pid)..."
                sleep 5
                wait_time=$((wait_time + 5))
                continue
            else
                log_warn "Removing stale lock file"
                rm -f "$LOCK_FILE"
            fi
        fi
        
        # Atomic lock creation
        if (set -C; echo $$ > "$LOCK_FILE") 2>/dev/null; then
            log_info "Acquired deployment lock"
            return 0
        fi
        
        sleep 1
        wait_time=$((wait_time + 1))
    done
    
    log_error "Failed to acquire lock after ${max_wait}s"
    return 1
}

# Improved git authentication
setup_git_auth() {
    if [ -z "${GITHUB_PAT:-}" ]; then
        log_warn "GITHUB_PAT not set, using existing credentials"
        return 0
    fi
    
    log_info "Configuring git credentials..."
    
    # Use credential cache with shorter timeout
    git config --local credential.helper 'cache --timeout=300'
    
    # Verify credentials work without storing them permanently
    if ! echo "protocol=https
host=github.com
username=x-access-token
password=${GITHUB_PAT}" | git credential fill | git credential approve; then
        log_error "Failed to setup git credentials"
        return 1
    fi
}

# Safe git operations with better error handling
safe_git_fetch() {
    log_info "Fetching latest changes from origin/main..."
    
    # Check if remote exists
    if ! git remote get-url origin >/dev/null 2>&1; then
        log_error "Origin remote not configured"
        return 1
    fi
    
    if ! timeout 60 git fetch origin main 2>&1 | tee -a "$LOG_FILE"; then
        log_error "Git fetch failed or timed out"
        return 1
    fi
    
    return 0
}

safe_git_pull() {
    log_info "Pulling latest changes..."
    
    # Check if working directory is clean
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
        log_warn "Working directory has uncommitted changes"
        git status --porcelain | head -10 | while read -r line; do
            log_warn "  $line"
        done
    fi
    
    # Check if we're behind remote
    local_sha=$(git rev-parse HEAD)
    remote_sha=$(git rev-parse origin/main)
    
    if [ "$local_sha" = "$remote_sha" ]; then
        log_info "Repository is already up to date"
        return 0
    fi
    
    if ! timeout 60 git pull origin main 2>&1 | tee -a "$LOG_FILE"; then
        log_error "Git pull failed or timed out"
        return 1
    fi
    
    return 0
}

# Analyze changed files for markdown-server
analyze_changes() {
    payload="$1"
    
    # Extract changed files
    changed_files=$(echo "$payload" | jq -r '
        (.commits // [])[] |
        (.added // [])[], (.modified // [])[], (.removed // [])[]
    ' 2>/dev/null | sort -u | head -100)
    
    if [ -z "$changed_files" ]; then
        log_info "No changed files detected, deploying markdown-server"
        echo "deploy:true"
        return 0
    fi
    
    log_info "Analyzing changed files:"
    echo "$changed_files" | while read -r file; do
        [ -n "$file" ] && log_info "  - $file"
    done
    
    # For this project, deploy if any content or markdown-server files changed
    echo "deploy:true"
}

# Docker operations for markdown-server
deploy_markdown_server() {
    log_info "Starting markdown-server deployment..."
    
    cd "$REPO_ROOT" || {
        log_error "Failed to change to repository root: $REPO_ROOT"
        return 1
    }
    
    # Pull latest changes
    safe_git_pull || return 1
    
    log_info "Stopping and removing old markdown-server container..."
    docker compose stop markdown-server || true
    docker compose rm -f markdown-server || true
    
    log_info "Building new markdown-server image..."
    docker compose build --no-cache markdown-server
    
    log_info "Starting markdown-server container..."
    docker compose up -d markdown-server
    
    # Wait for container to be healthy
    sleep 5
    if docker compose ps markdown-server | grep -q "Up"; then
        log_info "markdown-server container is running"
    else
        log_error "markdown-server container failed to start"
        docker compose logs --tail=50 markdown-server
        return 1
    fi
    
    log_info "Cleaning up old Docker images..."
    docker image prune -f
    
    log_info "Markdown-server deployment completed successfully"
}

# Main execution
main() {
    commit_id="${1:-unknown}"
    pusher_name="${2:-unknown}"
    payload="${3:-{}}"
    
    log_info "=== Deployment Started ==="
    log_info "Commit: $commit_id, Pusher: $pusher_name"
    
    # Validate inputs
    validate_inputs "$commit_id" "$pusher_name" "$payload" || exit 1
    
    # Acquire lock
    acquire_lock || exit 1
    
    # Change to repository root
    cd "$REPO_ROOT" || {
        log_error "Failed to change to repository root: $REPO_ROOT"
        exit 1
    }
    
    # Check if we're in a git repository
    if [ ! -d ".git" ]; then
        log_error "Not in a git repository. /repo should be mounted from the host."
        log_error "Current directory: $(pwd)"
        ls -la | tee -a "$LOG_FILE"
        exit 1
    fi
    
    # Setup git authentication
    setup_git_auth
    
    # Fetch latest changes
    safe_git_fetch || exit 1
    
    # Analyze what needs to be deployed
    analysis=$(analyze_changes "$payload")
    should_deploy=$(echo "$analysis" | grep "^deploy:" | cut -d: -f2)
    
    # Execute deployment
    if [ "$should_deploy" = "true" ]; then
        deploy_markdown_server
    else
        log_info "No deployment required"
    fi
    
    log_info "=== Deployment Completed Successfully ==="
    log_info "Commit $commit_id by $pusher_name has been deployed"
}

# Script entry point
if [ "$(basename "$0")" = "deploy.sh" ]; then
    main "$@"
fi
