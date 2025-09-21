#!/bin/bash

# RateMe Staging Deployment Script
# Usage: ./scripts/deploy/staging.sh [IMAGE_TAG]

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.staging.yml"
ENV_FILE="$PROJECT_DIR/.env.staging"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check requirements
check_requirements() {
    log_info "Checking deployment requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check environment file
    if [[ ! -f "$ENV_FILE" ]]; then
        log_error "Environment file not found: $ENV_FILE"
        log_info "Please copy .env.staging.example to .env.staging and configure it"
        exit 1
    fi
    
    # Check compose file
    if [[ ! -f "$COMPOSE_FILE" ]]; then
        log_error "Compose file not found: $COMPOSE_FILE"
        exit 1
    fi
    
    log_success "All requirements met"
}

# Load environment variables
load_environment() {
    log_info "Loading staging environment variables..."
    
    if [[ -f "$ENV_FILE" ]]; then
        export $(grep -v '^#' "$ENV_FILE" | xargs)
        log_success "Environment variables loaded"
    else
        log_error "Environment file not found: $ENV_FILE"
        exit 1
    fi
}

# Pre-deployment checks
pre_deployment_checks() {
    log_info "Running pre-deployment checks..."
    
    # Check disk space
    AVAILABLE_SPACE=$(df / | tail -1 | awk '{print $4}')
    REQUIRED_SPACE=1048576 # 1GB in KB
    
    if [[ $AVAILABLE_SPACE -lt $REQUIRED_SPACE ]]; then
        log_error "Insufficient disk space. Required: 1GB, Available: $(($AVAILABLE_SPACE/1024))MB"
        exit 1
    fi
    
    # Check if ports are available
    if netstat -tuln | grep -q ":80 "; then
        log_warning "Port 80 is already in use"
    fi
    
    if netstat -tuln | grep -q ":443 "; then
        log_warning "Port 443 is already in use"
    fi
    
    log_success "Pre-deployment checks passed"
}

# Create backup
create_backup() {
    log_info "Creating backup before deployment..."
    
    BACKUP_DIR="$PROJECT_DIR/backup/staging"
    BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).sql"
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup database if it exists
    if docker-compose -f "$COMPOSE_FILE" ps postgres | grep -q "Up"; then
        log_info "Backing up staging database..."
        docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U staging_user ratemy_staging > "$BACKUP_FILE"
        log_success "Database backup created: $BACKUP_FILE"
    else
        log_info "No existing database to backup"
    fi
}

# Pull latest images
pull_images() {
    log_info "Pulling latest Docker images..."
    
    cd "$PROJECT_DIR"
    docker-compose -f "$COMPOSE_FILE" pull
    
    log_success "Images pulled successfully"
}

# Deploy application
deploy_application() {
    local image_tag=${1:-latest}
    
    log_info "Deploying RateMe staging with image tag: $image_tag"
    
    cd "$PROJECT_DIR"
    
    # Set image tag
    export IMAGE_TAG="$image_tag"
    
    # Stop existing services
    log_info "Stopping existing services..."
    docker-compose -f "$COMPOSE_FILE" down --remove-orphans
    
    # Start new services
    log_info "Starting new services..."
    docker-compose -f "$COMPOSE_FILE" up -d
    
    log_success "Services started"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    cd "$PROJECT_DIR"
    
    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    sleep 30
    
    # Run migrations inside the app container
    if docker-compose -f "$COMPOSE_FILE" exec -T app npm run db:migrate; then
        log_success "Database migrations completed"
    else
        log_warning "Database migrations failed or not needed"
    fi
}

# Health check
health_check() {
    log_info "Performing health checks..."
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log_info "Health check attempt $attempt/$max_attempts..."
        
        if curl -f -s http://localhost:3000/api/health > /dev/null; then
            log_success "Application is healthy!"
            return 0
        fi
        
        sleep 10
        ((attempt++))
    done
    
    log_error "Health check failed after $max_attempts attempts"
    return 1
}

# Post-deployment verification
post_deployment_verification() {
    log_info "Running post-deployment verification..."
    
    # Check all services are running
    log_info "Checking service status..."
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Exit"; then
        log_error "Some services failed to start"
        docker-compose -f "$COMPOSE_FILE" ps
        return 1
    fi
    
    # Test API endpoints
    log_info "Testing API endpoints..."
    
    # Health endpoint
    if curl -f -s http://localhost:3000/api/health | jq -e '.success == true' > /dev/null; then
        log_success "Health endpoint working"
    else
        log_error "Health endpoint failed"
        return 1
    fi
    
    # Test HTTPS if configured
    if command -v openssl &> /dev/null; then
        log_info "Testing SSL certificate..."
        if openssl s_client -connect staging.ratemy.app:443 -servername staging.ratemy.app < /dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
            log_success "SSL certificate is valid"
        else
            log_warning "SSL certificate verification failed or not configured"
        fi
    fi
    
    log_success "Post-deployment verification completed"
}

# Cleanup old images
cleanup() {
    log_info "Cleaning up old Docker images..."
    
    # Remove dangling images
    docker image prune -f
    
    # Remove old versions (keep last 3)
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.ID}}" | \
        grep ratemy | \
        tail -n +4 | \
        awk '{print $3}' | \
        xargs -r docker rmi -f
    
    log_success "Cleanup completed"
}

# Main deployment function
main() {
    local image_tag=${1:-latest}
    
    log_info "Starting RateMe staging deployment..."
    log_info "Image tag: $image_tag"
    log_info "Timestamp: $(date)"
    
    # Run all deployment steps
    check_requirements
    load_environment
    pre_deployment_checks
    create_backup
    pull_images
    deploy_application "$image_tag"
    run_migrations
    
    # Health check with proper error handling
    if health_check; then
        post_deployment_verification
        cleanup
        
        log_success "🎉 Staging deployment completed successfully!"
        log_info "Application is available at: https://staging.ratemy.app"
        log_info "Monitoring dashboard: https://grafana-staging.ratemy.app"
    else
        log_error "❌ Deployment failed during health check"
        log_info "Check logs with: docker-compose -f $COMPOSE_FILE logs"
        exit 1
    fi
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi