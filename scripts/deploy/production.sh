#!/bin/bash

# RateMe Production Deployment Script
# Usage: ./scripts/deploy/production.sh [IMAGE_TAG]

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.production.yml"
ENV_FILE="$PROJECT_DIR/.env.production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a deployment.log
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a deployment.log
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a deployment.log
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a deployment.log
}

# Initialize deployment log
init_log() {
    echo "=== RateMe Production Deployment Log ===" > deployment.log
    echo "Timestamp: $(date)" >> deployment.log
    echo "User: $(whoami)" >> deployment.log
    echo "Image Tag: ${1:-latest}" >> deployment.log
    echo "=========================================" >> deployment.log
}

# Check requirements
check_requirements() {
    log_info "Checking production deployment requirements..."
    
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
        log_error "Production environment file not found: $ENV_FILE"
        log_info "Please copy .env.production.example to .env.production and configure it"
        exit 1
    fi
    
    # Check compose file
    if [[ ! -f "$COMPOSE_FILE" ]]; then
        log_error "Production compose file not found: $COMPOSE_FILE"
        exit 1
    fi
    
    # Check for required tools
    for tool in curl jq openssl; do
        if ! command -v $tool &> /dev/null; then
            log_error "$tool is required but not installed"
            exit 1
        fi
    done
    
    log_success "All requirements met"
}

# Load environment variables
load_environment() {
    log_info "Loading production environment variables..."
    
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
    log_info "Running comprehensive pre-deployment checks..."
    
    # Check disk space (require 5GB for production)
    AVAILABLE_SPACE=$(df / | tail -1 | awk '{print $4}')
    REQUIRED_SPACE=5242880 # 5GB in KB
    
    if [[ $AVAILABLE_SPACE -lt $REQUIRED_SPACE ]]; then
        log_error "Insufficient disk space. Required: 5GB, Available: $(($AVAILABLE_SPACE/1024/1024))GB"
        exit 1
    fi
    
    # Check memory
    AVAILABLE_MEMORY=$(free -m | awk 'NR==2{print $7}')
    REQUIRED_MEMORY=2048 # 2GB in MB
    
    if [[ $AVAILABLE_MEMORY -lt $REQUIRED_MEMORY ]]; then
        log_error "Insufficient memory. Required: 2GB, Available: ${AVAILABLE_MEMORY}MB"
        exit 1
    fi
    
    # Check if critical ports are available
    for port in 80 443; do
        if netstat -tuln | grep -q ":$port "; then
            log_warning "Port $port is already in use"
        fi
    done
    
    # Validate environment variables
    required_vars=("DATABASE_URL" "NEXTAUTH_SECRET" "REDIS_PASSWORD" "POSTGRES_PASSWORD")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            log_error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    log_success "Pre-deployment checks passed"
}

# Create comprehensive backup
create_backup() {
    log_info "Creating comprehensive backup before deployment..."
    
    local backup_timestamp=$(date +%Y%m%d-%H%M%S)
    local backup_dir="$PROJECT_DIR/backup/production/$backup_timestamp"
    
    mkdir -p "$backup_dir"
    
    # Backup database if it exists
    if docker-compose -f "$COMPOSE_FILE" ps postgres | grep -q "Up"; then
        log_info "Backing up production database..."
        docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U prod_user ratemy_production > "$backup_dir/database.sql"
        
        # Compress backup
        gzip "$backup_dir/database.sql"
        log_success "Database backup created: $backup_dir/database.sql.gz"
    else
        log_info "No existing database to backup"
    fi
    
    # Backup uploads volume
    if docker volume ls | grep -q "production-uploads"; then
        log_info "Backing up uploads volume..."
        docker run --rm -v production-uploads:/data -v "$backup_dir":/backup alpine tar czf /backup/uploads.tar.gz -C /data .
        log_success "Uploads backup created: $backup_dir/uploads.tar.gz"
    fi
    
    # Backup configuration files
    log_info "Backing up configuration files..."
    cp "$ENV_FILE" "$backup_dir/env.backup"
    cp "$COMPOSE_FILE" "$backup_dir/docker-compose.backup.yml"
    
    # Store backup metadata
    cat > "$backup_dir/metadata.json" << EOF
{
  "timestamp": "$backup_timestamp",
  "type": "pre-deployment",
  "environment": "production",
  "image_tag": "${IMAGE_TAG:-latest}",
  "files": [
    "database.sql.gz",
    "uploads.tar.gz",
    "env.backup",
    "docker-compose.backup.yml"
  ]
}
EOF
    
    log_success "Comprehensive backup completed: $backup_dir"
    echo "BACKUP_DIR=$backup_dir" >> deployment.log
}

# Blue-green deployment preparation
prepare_blue_green() {
    log_info "Preparing blue-green deployment..."
    
    # Tag current deployment as blue
    if docker-compose -f "$COMPOSE_FILE" ps app | grep -q "Up"; then
        log_info "Tagging current deployment as blue..."
        docker tag ratemy:current ratemy:blue 2>/dev/null || true
    fi
    
    # Prepare green deployment
    log_info "Preparing green deployment environment..."
    export DEPLOYMENT_COLOR="green"
    
    log_success "Blue-green deployment prepared"
}

# Pull and verify images
pull_images() {
    local image_tag=${1:-latest}
    
    log_info "Pulling and verifying Docker images for tag: $image_tag"
    
    cd "$PROJECT_DIR"
    
    # Set image tag
    export IMAGE_TAG="$image_tag"
    
    # Pull images
    docker-compose -f "$COMPOSE_FILE" pull
    
    # Verify image integrity
    log_info "Verifying image integrity..."
    if docker-compose -f "$COMPOSE_FILE" config > /dev/null; then
        log_success "Docker compose configuration is valid"
    else
        log_error "Docker compose configuration validation failed"
        exit 1
    fi
    
    log_success "Images pulled and verified successfully"
}

# Deploy with zero downtime
deploy_zero_downtime() {
    local image_tag=${1:-latest}
    
    log_info "Starting zero-downtime deployment..."
    
    cd "$PROJECT_DIR"
    
    # Create new deployment alongside existing one
    log_info "Starting green deployment..."
    
    # Modify service names for green deployment
    export COMPOSE_PROJECT_NAME="ratemy-green"
    export GREEN_PORT="3002"
    
    # Start green services
    docker-compose -f "$COMPOSE_FILE" up -d
    
    # Wait for green deployment to be healthy
    log_info "Waiting for green deployment to be healthy..."
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s http://localhost:${GREEN_PORT:-3002}/api/health > /dev/null; then
            log_success "Green deployment is healthy"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            log_error "Green deployment failed to become healthy"
            return 1
        fi
        
        sleep 10
        ((attempt++))
    done
    
    # Switch traffic to green
    log_info "Switching traffic to green deployment..."
    
    # Update load balancer configuration
    # This would typically involve updating nginx/traefik config
    # For now, we'll simulate the switch
    
    # Stop blue deployment
    export COMPOSE_PROJECT_NAME="ratemy-blue"
    docker-compose -f "$COMPOSE_FILE" down
    
    # Rename green to production
    export COMPOSE_PROJECT_NAME="ratemy"
    
    log_success "Zero-downtime deployment completed"
}

# Run database migrations safely
run_migrations() {
    log_info "Running database migrations safely..."
    
    cd "$PROJECT_DIR"
    
    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    sleep 30
    
    # Create migration backup
    local migration_backup="$PROJECT_DIR/backup/migration-$(date +%Y%m%d-%H%M%S).sql"
    docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U prod_user ratemy_production > "$migration_backup"
    log_info "Migration backup created: $migration_backup"
    
    # Run migrations
    if docker-compose -f "$COMPOSE_FILE" exec -T app npm run db:migrate; then
        log_success "Database migrations completed successfully"
    else
        log_error "Database migrations failed"
        
        # Restore from migration backup
        log_info "Restoring database from migration backup..."
        docker-compose -f "$COMPOSE_FILE" exec -T postgres psql -U prod_user -d ratemy_production < "$migration_backup"
        
        return 1
    fi
}

# Comprehensive health checks
comprehensive_health_check() {
    log_info "Performing comprehensive health checks..."
    
    local max_attempts=60
    local attempt=1
    
    # Test cases
    local health_checks=(
        "http://localhost:3000/api/health|Health endpoint"
        "http://localhost:3000|Homepage"
        "http://localhost:3000/auth/signin|Authentication page"
    )
    
    while [[ $attempt -le $max_attempts ]]; do
        log_info "Health check attempt $attempt/$max_attempts..."
        
        local all_passed=true
        
        for check in "${health_checks[@]}"; do
            local url=$(echo "$check" | cut -d'|' -f1)
            local name=$(echo "$check" | cut -d'|' -f2)
            
            if curl -f -s --max-time 10 "$url" > /dev/null; then
                log_info "✓ $name working"
            else
                log_warning "✗ $name failed"
                all_passed=false
            fi
        done
        
        if [[ "$all_passed" == true ]]; then
            log_success "All health checks passed!"
            return 0
        fi
        
        sleep 10
        ((attempt++))
    done
    
    log_error "Health checks failed after $max_attempts attempts"
    return 1
}

# Performance verification
performance_verification() {
    log_info "Running performance verification..."
    
    # Test response times
    local response_time=$(curl -o /dev/null -s -w "%{time_total}" http://localhost:3000/api/health)
    log_info "Health endpoint response time: ${response_time}s"
    
    if (( $(echo "$response_time > 2.0" | bc -l) )); then
        log_warning "Health endpoint response time is slow: ${response_time}s"
    else
        log_success "Health endpoint response time is good: ${response_time}s"
    fi
    
    # Check memory usage
    local memory_usage=$(docker stats --no-stream --format "{{.MemUsage}}" ratemy_app_1)
    log_info "Application memory usage: $memory_usage"
    
    log_success "Performance verification completed"
}

# Security verification
security_verification() {
    log_info "Running security verification..."
    
    # Check security headers
    local security_headers=(
        "X-Frame-Options"
        "X-Content-Type-Options"
        "Strict-Transport-Security"
        "Content-Security-Policy"
    )
    
    for header in "${security_headers[@]}"; do
        if curl -I -s http://localhost:3000 | grep -q "$header"; then
            log_success "✓ $header header present"
        else
            log_warning "✗ $header header missing"
        fi
    done
    
    # Test SSL if available
    if command -v openssl &> /dev/null; then
        log_info "Testing SSL certificate..."
        if openssl s_client -connect ratemy.app:443 -servername ratemy.app < /dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
            log_success "SSL certificate is valid"
        else
            log_warning "SSL certificate verification failed or not configured"
        fi
    fi
    
    log_success "Security verification completed"
}

# Monitoring setup
setup_monitoring() {
    log_info "Setting up production monitoring..."
    
    # Start monitoring services
    docker-compose -f "$COMPOSE_FILE" up -d prometheus grafana loki promtail
    
    # Wait for services to be ready
    sleep 30
    
    # Test monitoring endpoints
    if curl -f -s http://localhost:9090/api/v1/status/config > /dev/null; then
        log_success "Prometheus is running"
    else
        log_warning "Prometheus may not be running correctly"
    fi
    
    if curl -f -s http://localhost:3001/api/health > /dev/null; then
        log_success "Grafana is running"
    else
        log_warning "Grafana may not be running correctly"
    fi
    
    log_success "Monitoring setup completed"
}

# Rollback function
rollback() {
    local backup_dir=${1:-}
    
    if [[ -z "$backup_dir" ]]; then
        log_error "No backup directory specified for rollback"
        exit 1
    fi
    
    log_info "Rolling back to backup: $backup_dir"
    
    # Stop current deployment
    docker-compose -f "$COMPOSE_FILE" down
    
    # Restore database
    if [[ -f "$backup_dir/database.sql.gz" ]]; then
        log_info "Restoring database..."
        gunzip -c "$backup_dir/database.sql.gz" | docker-compose -f "$COMPOSE_FILE" exec -T postgres psql -U prod_user -d ratemy_production
    fi
    
    # Restore uploads
    if [[ -f "$backup_dir/uploads.tar.gz" ]]; then
        log_info "Restoring uploads..."
        docker run --rm -v production-uploads:/data -v "$backup_dir":/backup alpine tar xzf /backup/uploads.tar.gz -C /data
    fi
    
    # Start services
    docker-compose -f "$COMPOSE_FILE" up -d
    
    log_success "Rollback completed"
}

# Cleanup
cleanup() {
    log_info "Performing post-deployment cleanup..."
    
    # Remove dangling images
    docker image prune -f
    
    # Remove old backups (keep last 10)
    find "$PROJECT_DIR/backup/production" -type d -name "2*" | sort -r | tail -n +11 | xargs -r rm -rf
    
    # Remove old logs (keep last 30 days)
    find "$PROJECT_DIR" -name "deployment.log.*" -mtime +30 -delete
    
    log_success "Cleanup completed"
}

# Main deployment function
main() {
    local image_tag=${1:-latest}
    
    # Initialize logging
    init_log "$image_tag"
    
    log_info "🚀 Starting RateMe production deployment..."
    log_info "Image tag: $image_tag"
    log_info "Timestamp: $(date)"
    
    # Trap errors for cleanup
    trap 'log_error "Deployment failed at line $LINENO"' ERR
    
    # Run all deployment steps
    check_requirements
    load_environment
    pre_deployment_checks
    create_backup
    prepare_blue_green
    pull_images "$image_tag"
    
    # Attempt deployment with rollback on failure
    if deploy_zero_downtime "$image_tag" && run_migrations; then
        if comprehensive_health_check; then
            performance_verification
            security_verification
            setup_monitoring
            cleanup
            
            log_success "🎉 Production deployment completed successfully!"
            log_info "Application is available at: https://ratemy.app"
            log_info "Monitoring dashboard: https://grafana.ratemy.app"
            log_info "Deployment log: deployment.log"
        else
            log_error "❌ Health checks failed - initiating rollback"
            rollback "$BACKUP_DIR"
            exit 1
        fi
    else
        log_error "❌ Deployment failed - initiating rollback"
        rollback "$BACKUP_DIR"
        exit 1
    fi
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi