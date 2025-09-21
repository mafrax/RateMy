#!/bin/bash

# RateMe Emergency Rollback Script
# Usage: ./scripts/rollback.sh [ENVIRONMENT] [BACKUP_ID]

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a rollback.log
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a rollback.log
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a rollback.log
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a rollback.log
}

# Initialize rollback log
init_log() {
    echo "=== RateMe Emergency Rollback Log ===" > rollback.log
    echo "Timestamp: $(date)" >> rollback.log
    echo "User: $(whoami)" >> rollback.log
    echo "Environment: ${1:-unknown}" >> rollback.log
    echo "Backup ID: ${2:-unknown}" >> rollback.log
    echo "=========================================" >> rollback.log
}

# Display help
show_help() {
    cat << EOF
RateMe Emergency Rollback Script

Usage: $0 [ENVIRONMENT] [BACKUP_ID]

ENVIRONMENT:
  staging     - Rollback staging environment
  production  - Rollback production environment

BACKUP_ID:
  auto        - Use most recent backup (default)
  YYYYMMDD-HHMMSS - Use specific backup timestamp
  list        - List available backups

Examples:
  $0 staging auto                    # Rollback staging to latest backup
  $0 production 20241201-143022      # Rollback production to specific backup
  $0 staging list                    # List available staging backups

EOF
}

# List available backups
list_backups() {
    local environment=$1
    local backup_dir="$PROJECT_DIR/backup/$environment"
    
    log_info "Available backups for $environment:"
    
    if [[ ! -d "$backup_dir" ]]; then
        log_warning "No backup directory found for $environment"
        return 1
    fi
    
    local backups=($(find "$backup_dir" -type d -name "2*" | sort -r))
    
    if [[ ${#backups[@]} -eq 0 ]]; then
        log_warning "No backups found for $environment"
        return 1
    fi
    
    echo ""
    echo "Timestamp          | Size    | Files"
    echo "-------------------|---------|-------"
    
    for backup in "${backups[@]}"; do
        local timestamp=$(basename "$backup")
        local size=$(du -sh "$backup" | cut -f1)
        local files=$(find "$backup" -type f | wc -l)
        
        printf "%-18s | %-7s | %d files\n" "$timestamp" "$size" "$files"
    done
    
    echo ""
}

# Get backup directory
get_backup_dir() {
    local environment=$1
    local backup_id=$2
    local backup_base_dir="$PROJECT_DIR/backup/$environment"
    
    if [[ "$backup_id" == "auto" ]] || [[ -z "$backup_id" ]]; then
        # Get most recent backup
        local latest=$(find "$backup_base_dir" -type d -name "2*" | sort -r | head -1)
        if [[ -z "$latest" ]]; then
            log_error "No backups found for auto rollback"
            exit 1
        fi
        echo "$latest"
    else
        # Use specific backup
        local specific="$backup_base_dir/$backup_id"
        if [[ ! -d "$specific" ]]; then
            log_error "Backup not found: $specific"
            exit 1
        fi
        echo "$specific"
    fi
}

# Validate backup
validate_backup() {
    local backup_dir=$1
    
    log_info "Validating backup: $backup_dir"
    
    # Check if backup directory exists
    if [[ ! -d "$backup_dir" ]]; then
        log_error "Backup directory not found: $backup_dir"
        return 1
    fi
    
    # Check for required files
    local required_files=("metadata.json")
    local optional_files=("database.sql.gz" "uploads.tar.gz" "env.backup")
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$backup_dir/$file" ]]; then
            log_error "Required backup file missing: $file"
            return 1
        fi
    done
    
    # Check metadata
    if ! jq -e '.timestamp' "$backup_dir/metadata.json" > /dev/null 2>&1; then
        log_error "Invalid metadata.json format"
        return 1
    fi
    
    # List available backup components
    log_info "Backup components found:"
    for file in "${optional_files[@]}"; do
        if [[ -f "$backup_dir/$file" ]]; then
            local size=$(du -sh "$backup_dir/$file" | cut -f1)
            log_info "  ✓ $file ($size)"
        else
            log_warning "  ✗ $file (not found)"
        fi
    done
    
    log_success "Backup validation completed"
    return 0
}

# Create pre-rollback snapshot
create_pre_rollback_snapshot() {
    local environment=$1
    local compose_file="$PROJECT_DIR/docker-compose.$environment.yml"
    
    log_info "Creating pre-rollback snapshot..."
    
    local snapshot_dir="$PROJECT_DIR/backup/$environment/pre-rollback-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$snapshot_dir"
    
    # Snapshot current database if running
    if docker-compose -f "$compose_file" ps postgres | grep -q "Up"; then
        log_info "Creating database snapshot..."
        if [[ "$environment" == "production" ]]; then
            docker-compose -f "$compose_file" exec -T postgres pg_dump -U prod_user ratemy_production > "$snapshot_dir/current-database.sql"
        else
            docker-compose -f "$compose_file" exec -T postgres pg_dump -U staging_user ratemy_staging > "$snapshot_dir/current-database.sql"
        fi
        gzip "$snapshot_dir/current-database.sql"
        log_success "Database snapshot created"
    fi
    
    # Snapshot current uploads if volume exists
    local volume_name="${environment}-uploads"
    if docker volume ls | grep -q "$volume_name"; then
        log_info "Creating uploads snapshot..."
        docker run --rm -v "$volume_name":/data -v "$snapshot_dir":/backup alpine tar czf /backup/current-uploads.tar.gz -C /data .
        log_success "Uploads snapshot created"
    fi
    
    # Save current environment
    if [[ -f "$PROJECT_DIR/.env.$environment" ]]; then
        cp "$PROJECT_DIR/.env.$environment" "$snapshot_dir/current-env.backup"
    fi
    
    # Create snapshot metadata
    cat > "$snapshot_dir/metadata.json" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "type": "pre-rollback-snapshot",
  "environment": "$environment",
  "purpose": "Snapshot before rollback operation"
}
EOF
    
    log_success "Pre-rollback snapshot created: $snapshot_dir"
    echo "$snapshot_dir"
}

# Stop services safely
stop_services() {
    local environment=$1
    local compose_file="$PROJECT_DIR/docker-compose.$environment.yml"
    
    log_info "Stopping $environment services safely..."
    
    if [[ ! -f "$compose_file" ]]; then
        log_warning "Compose file not found: $compose_file"
        return 1
    fi
    
    # Graceful shutdown with timeout
    timeout 60 docker-compose -f "$compose_file" down || {
        log_warning "Graceful shutdown timed out, forcing stop..."
        docker-compose -f "$compose_file" down --timeout 10
    }
    
    log_success "Services stopped"
}

# Restore database
restore_database() {
    local environment=$1
    local backup_dir=$2
    local compose_file="$PROJECT_DIR/docker-compose.$environment.yml"
    
    log_info "Restoring database from backup..."
    
    local db_backup="$backup_dir/database.sql.gz"
    if [[ ! -f "$db_backup" ]]; then
        log_warning "No database backup found, skipping database restore"
        return 0
    fi
    
    # Start only the database service
    log_info "Starting database service..."
    docker-compose -f "$compose_file" up -d postgres
    
    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    sleep 30
    
    # Restore database
    log_info "Restoring database content..."
    if [[ "$environment" == "production" ]]; then
        gunzip -c "$db_backup" | docker-compose -f "$compose_file" exec -T postgres psql -U prod_user -d ratemy_production
    else
        gunzip -c "$db_backup" | docker-compose -f "$compose_file" exec -T postgres psql -U staging_user -d ratemy_staging
    fi
    
    log_success "Database restored successfully"
}

# Restore uploads
restore_uploads() {
    local environment=$1
    local backup_dir=$2
    
    log_info "Restoring uploads from backup..."
    
    local uploads_backup="$backup_dir/uploads.tar.gz"
    if [[ ! -f "$uploads_backup" ]]; then
        log_warning "No uploads backup found, skipping uploads restore"
        return 0
    fi
    
    local volume_name="${environment}-uploads"
    
    # Remove existing uploads volume
    if docker volume ls | grep -q "$volume_name"; then
        log_info "Removing existing uploads volume..."
        docker volume rm "$volume_name" || log_warning "Could not remove existing uploads volume"
    fi
    
    # Create new volume and restore content
    log_info "Creating new uploads volume and restoring content..."
    docker volume create "$volume_name"
    docker run --rm -v "$volume_name":/data -v "$backup_dir":/backup alpine tar xzf /backup/uploads.tar.gz -C /data
    
    log_success "Uploads restored successfully"
}

# Restore configuration
restore_configuration() {
    local environment=$1
    local backup_dir=$2
    
    log_info "Restoring configuration from backup..."
    
    local env_backup="$backup_dir/env.backup"
    if [[ -f "$env_backup" ]]; then
        cp "$env_backup" "$PROJECT_DIR/.env.$environment"
        log_success "Environment configuration restored"
    else
        log_warning "No environment backup found, keeping current configuration"
    fi
    
    local compose_backup="$backup_dir/docker-compose.backup.yml"
    if [[ -f "$compose_backup" ]]; then
        cp "$compose_backup" "$PROJECT_DIR/docker-compose.$environment.yml"
        log_success "Docker compose configuration restored"
    else
        log_warning "No compose backup found, keeping current configuration"
    fi
}

# Start services after rollback
start_services() {
    local environment=$1
    local compose_file="$PROJECT_DIR/docker-compose.$environment.yml"
    
    log_info "Starting services after rollback..."
    
    # Load environment variables
    if [[ -f "$PROJECT_DIR/.env.$environment" ]]; then
        export $(grep -v '^#' "$PROJECT_DIR/.env.$environment" | xargs)
    fi
    
    # Start all services
    docker-compose -f "$compose_file" up -d
    
    log_success "Services started"
}

# Verify rollback
verify_rollback() {
    local environment=$1
    
    log_info "Verifying rollback success..."
    
    local port=3000
    if [[ "$environment" == "staging" ]]; then
        port=3000
    fi
    
    # Wait for application to be ready
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log_info "Health check attempt $attempt/$max_attempts..."
        
        if curl -f -s --max-time 10 "http://localhost:$port/api/health" > /dev/null; then
            log_success "Application is responding after rollback"
            
            # Additional verification
            local response=$(curl -s "http://localhost:$port/api/health")
            if echo "$response" | jq -e '.success == true' > /dev/null; then
                log_success "Health check passed - rollback verified"
                return 0
            fi
        fi
        
        sleep 10
        ((attempt++))
    done
    
    log_error "Rollback verification failed - application not responding properly"
    return 1
}

# Main rollback function
perform_rollback() {
    local environment=$1
    local backup_id=${2:-auto}
    
    log_info "🔄 Starting emergency rollback for $environment environment..."
    
    # Get backup directory
    local backup_dir=$(get_backup_dir "$environment" "$backup_id")
    log_info "Using backup: $backup_dir"
    
    # Validate backup
    if ! validate_backup "$backup_dir"; then
        log_error "Backup validation failed"
        exit 1
    fi
    
    # Show backup information
    local backup_timestamp=$(jq -r '.timestamp' "$backup_dir/metadata.json")
    local backup_type=$(jq -r '.type' "$backup_dir/metadata.json")
    log_info "Backup timestamp: $backup_timestamp"
    log_info "Backup type: $backup_type"
    
    # Confirmation for production
    if [[ "$environment" == "production" ]]; then
        echo ""
        log_warning "⚠️  You are about to rollback PRODUCTION environment!"
        log_warning "This will:"
        log_warning "  - Stop all production services"
        log_warning "  - Restore database to backup state"
        log_warning "  - Restore uploads to backup state"
        log_warning "  - Restore configuration to backup state"
        echo ""
        read -p "Are you absolutely sure you want to continue? (type 'ROLLBACK' to confirm): " confirmation
        
        if [[ "$confirmation" != "ROLLBACK" ]]; then
            log_info "Rollback cancelled by user"
            exit 0
        fi
    fi
    
    # Create pre-rollback snapshot
    local snapshot_dir=$(create_pre_rollback_snapshot "$environment")
    log_info "Pre-rollback snapshot: $snapshot_dir"
    
    # Perform rollback steps
    stop_services "$environment"
    restore_database "$environment" "$backup_dir"
    restore_uploads "$environment" "$backup_dir"
    restore_configuration "$environment" "$backup_dir"
    start_services "$environment"
    
    # Verify rollback
    if verify_rollback "$environment"; then
        log_success "🎉 Rollback completed successfully!"
        log_info "Pre-rollback snapshot available at: $snapshot_dir"
        log_info "Rollback log: rollback.log"
    else
        log_error "❌ Rollback verification failed!"
        log_error "Check the logs and manual intervention may be required"
        exit 1
    fi
}

# Main script logic
main() {
    local environment=${1:-}
    local backup_id=${2:-auto}
    
    # Initialize logging
    init_log "$environment" "$backup_id"
    
    # Handle special cases
    case "${environment:-}" in
        "" | "-h" | "--help")
            show_help
            exit 0
            ;;
        "staging" | "production")
            if [[ "$backup_id" == "list" ]]; then
                list_backups "$environment"
                exit 0
            fi
            ;;
        *)
            log_error "Invalid environment: $environment"
            show_help
            exit 1
            ;;
    esac
    
    # Perform rollback
    perform_rollback "$environment" "$backup_id"
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi