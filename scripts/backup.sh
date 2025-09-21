#!/bin/bash

# RateMe Automated Backup Script
# Usage: ./scripts/backup.sh [ENVIRONMENT] [TYPE]

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Default retention periods (days)
DAILY_RETENTION=7
WEEKLY_RETENTION=30
MONTHLY_RETENTION=90

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a backup.log
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a backup.log
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a backup.log
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a backup.log
}

# Initialize backup log
init_log() {
    echo "=== RateMe Backup Log ===" > backup.log
    echo "Timestamp: $(date)" >> backup.log
    echo "Environment: ${1:-unknown}" >> backup.log
    echo "Type: ${2:-manual}" >> backup.log
    echo "=========================" >> backup.log
}

# Display help
show_help() {
    cat << EOF
RateMe Automated Backup Script

Usage: $0 [ENVIRONMENT] [TYPE]

ENVIRONMENT:
  staging     - Backup staging environment
  production  - Backup production environment
  all         - Backup all environments

TYPE:
  manual      - Manual backup (default)
  daily       - Daily automated backup
  weekly      - Weekly automated backup
  monthly     - Monthly automated backup

Examples:
  $0 production manual     # Manual production backup
  $0 staging daily         # Daily staging backup
  $0 all weekly            # Weekly backup of all environments

The script will create timestamped backups in the backup/ directory
with automatic cleanup based on retention policies.

EOF
}

# Check requirements
check_requirements() {
    log_info "Checking backup requirements..."
    
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
    
    # Check disk space (require at least 1GB free)
    local available_space=$(df / | tail -1 | awk '{print $4}')
    local required_space=1048576 # 1GB in KB
    
    if [[ $available_space -lt $required_space ]]; then
        log_error "Insufficient disk space. Required: 1GB, Available: $(($available_space/1024))MB"
        exit 1
    fi
    
    log_success "Requirements check passed"
}

# Create backup directory structure
create_backup_structure() {
    local environment=$1
    local backup_type=$2
    local timestamp=$(date +%Y%m%d-%H%M%S)
    
    local backup_dir="$PROJECT_DIR/backup/$environment/$timestamp"
    mkdir -p "$backup_dir"
    
    echo "$backup_dir"
}

# Backup database
backup_database() {
    local environment=$1
    local backup_dir=$2
    local compose_file="$PROJECT_DIR/docker-compose.$environment.yml"
    
    log_info "Backing up $environment database..."
    
    # Check if database service is running
    if ! docker-compose -f "$compose_file" ps postgres | grep -q "Up"; then
        log_warning "Database service is not running for $environment"
        return 1
    fi
    
    # Create database backup
    local db_file="$backup_dir/database.sql"
    
    if [[ "$environment" == "production" ]]; then
        docker-compose -f "$compose_file" exec -T postgres pg_dump -U prod_user ratemy_production > "$db_file"
    else
        docker-compose -f "$compose_file" exec -T postgres pg_dump -U staging_user ratemy_staging > "$db_file"
    fi
    
    # Compress backup
    gzip "$db_file"
    
    local compressed_size=$(du -sh "$db_file.gz" | cut -f1)
    log_success "Database backup created: database.sql.gz ($compressed_size)"
    
    return 0
}

# Backup uploads volume
backup_uploads() {
    local environment=$1
    local backup_dir=$2
    
    log_info "Backing up $environment uploads..."
    
    local volume_name="${environment}-uploads"
    
    # Check if volume exists
    if ! docker volume ls | grep -q "$volume_name"; then
        log_warning "Uploads volume $volume_name does not exist"
        return 1
    fi
    
    # Create uploads backup
    local uploads_file="$backup_dir/uploads.tar.gz"
    
    docker run --rm \
        -v "$volume_name":/data \
        -v "$backup_dir":/backup \
        alpine tar czf /backup/uploads.tar.gz -C /data .
    
    local compressed_size=$(du -sh "$uploads_file" | cut -f1)
    log_success "Uploads backup created: uploads.tar.gz ($compressed_size)"
    
    return 0
}

# Backup configuration files
backup_configuration() {
    local environment=$1
    local backup_dir=$2
    
    log_info "Backing up $environment configuration..."
    
    # Backup environment file
    local env_file="$PROJECT_DIR/.env.$environment"
    if [[ -f "$env_file" ]]; then
        cp "$env_file" "$backup_dir/env.backup"
        log_success "Environment configuration backed up"
    else
        log_warning "Environment file not found: $env_file"
    fi
    
    # Backup compose file
    local compose_file="$PROJECT_DIR/docker-compose.$environment.yml"
    if [[ -f "$compose_file" ]]; then
        cp "$compose_file" "$backup_dir/docker-compose.backup.yml"
        log_success "Docker compose configuration backed up"
    else
        log_warning "Compose file not found: $compose_file"
    fi
    
    # Backup SSL certificates if they exist
    local ssl_dir="/etc/letsencrypt"
    if [[ -d "$ssl_dir" ]]; then
        log_info "Backing up SSL certificates..."
        tar czf "$backup_dir/ssl-certificates.tar.gz" -C /etc letsencrypt
        log_success "SSL certificates backed up"
    fi
}

# Create backup metadata
create_metadata() {
    local environment=$1
    local backup_dir=$2
    local backup_type=$3
    local start_time=$4
    local end_time=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    
    log_info "Creating backup metadata..."
    
    # Calculate backup size
    local total_size=$(du -sh "$backup_dir" | cut -f1)
    
    # List backup files
    local files=()
    for file in "$backup_dir"/*; do
        if [[ -f "$file" ]]; then
            files+=("$(basename "$file")")
        fi
    done
    
    # Create metadata file
    cat > "$backup_dir/metadata.json" << EOF
{
  "timestamp": "$start_time",
  "completed_at": "$end_time",
  "environment": "$environment",
  "type": "$backup_type",
  "total_size": "$total_size",
  "files": $(printf '%s\n' "${files[@]}" | jq -R . | jq -s .),
  "version": "1.0",
  "created_by": "$(whoami)",
  "hostname": "$(hostname)",
  "retention_policy": {
    "daily": $DAILY_RETENTION,
    "weekly": $WEEKLY_RETENTION,
    "monthly": $MONTHLY_RETENTION
  }
}
EOF
    
    log_success "Backup metadata created"
}

# Verify backup integrity
verify_backup() {
    local backup_dir=$1
    
    log_info "Verifying backup integrity..."
    
    local errors=0
    
    # Check metadata file
    if [[ ! -f "$backup_dir/metadata.json" ]]; then
        log_error "Metadata file missing"
        ((errors++))
    elif ! jq -e '.timestamp' "$backup_dir/metadata.json" > /dev/null 2>&1; then
        log_error "Invalid metadata format"
        ((errors++))
    fi
    
    # Check database backup
    if [[ -f "$backup_dir/database.sql.gz" ]]; then
        if gunzip -t "$backup_dir/database.sql.gz" 2>/dev/null; then
            log_success "Database backup is valid"
        else
            log_error "Database backup is corrupted"
            ((errors++))
        fi
    fi
    
    # Check uploads backup
    if [[ -f "$backup_dir/uploads.tar.gz" ]]; then
        if tar -tzf "$backup_dir/uploads.tar.gz" >/dev/null 2>&1; then
            log_success "Uploads backup is valid"
        else
            log_error "Uploads backup is corrupted"
            ((errors++))
        fi
    fi
    
    if [[ $errors -eq 0 ]]; then
        log_success "Backup integrity verification passed"
        return 0
    else
        log_error "Backup integrity verification failed ($errors errors)"
        return 1
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    local environment=$1
    local backup_type=$2
    
    log_info "Cleaning up old $backup_type backups for $environment..."
    
    local backup_base="$PROJECT_DIR/backup/$environment"
    
    if [[ ! -d "$backup_base" ]]; then
        log_info "No backup directory to clean up"
        return 0
    fi
    
    # Determine retention period
    local retention_days
    case "$backup_type" in
        daily)
            retention_days=$DAILY_RETENTION
            ;;
        weekly)
            retention_days=$WEEKLY_RETENTION
            ;;
        monthly)
            retention_days=$MONTHLY_RETENTION
            ;;
        *)
            retention_days=$DAILY_RETENTION
            ;;
    esac
    
    log_info "Retention policy: $retention_days days for $backup_type backups"
    
    # Find and remove old backups
    local deleted_count=0
    
    while IFS= read -r -d '' backup_dir; do
        local backup_age=$(find "$backup_dir" -maxdepth 0 -mtime +$retention_days)
        
        if [[ -n "$backup_age" ]]; then
            local backup_name=$(basename "$backup_dir")
            local backup_size=$(du -sh "$backup_dir" | cut -f1)
            
            log_info "Removing old backup: $backup_name ($backup_size)"
            rm -rf "$backup_dir"
            ((deleted_count++))
        fi
    done < <(find "$backup_base" -type d -name "2*" -print0)
    
    if [[ $deleted_count -gt 0 ]]; then
        log_success "Removed $deleted_count old backups"
    else
        log_info "No old backups to remove"
    fi
}

# Send backup notification
send_notification() {
    local environment=$1
    local backup_type=$2
    local status=$3
    local backup_dir=$4
    
    # This would integrate with notification systems like Slack, email, etc.
    # For now, just log the notification
    
    local message
    if [[ "$status" == "success" ]]; then
        local total_size=$(jq -r '.total_size' "$backup_dir/metadata.json")
        message="✅ $backup_type backup completed successfully for $environment ($total_size)"
    else
        message="❌ $backup_type backup failed for $environment"
    fi
    
    log_info "Notification: $message"
    
    # Future: Add actual notification sending here
    # curl -X POST -H 'Content-type: application/json' \
    #   --data "{\"text\":\"$message\"}" \
    #   "$SLACK_WEBHOOK_URL"
}

# Perform backup for single environment
backup_environment() {
    local environment=$1
    local backup_type=$2
    
    log_info "Starting $backup_type backup for $environment environment..."
    
    local start_time=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    local backup_dir=$(create_backup_structure "$environment" "$backup_type")
    
    log_info "Backup directory: $backup_dir"
    
    # Perform backup components
    local db_success=0
    local uploads_success=0
    local config_success=0
    
    backup_database "$environment" "$backup_dir" || db_success=1
    backup_uploads "$environment" "$backup_dir" || uploads_success=1
    backup_configuration "$environment" "$backup_dir" || config_success=1
    
    # Create metadata
    create_metadata "$environment" "$backup_dir" "$backup_type" "$start_time"
    
    # Verify backup
    if verify_backup "$backup_dir"; then
        # Cleanup old backups
        cleanup_old_backups "$environment" "$backup_type"
        
        # Send success notification
        send_notification "$environment" "$backup_type" "success" "$backup_dir"
        
        log_success "Backup completed successfully for $environment"
        return 0
    else
        # Send failure notification
        send_notification "$environment" "$backup_type" "failure" "$backup_dir"
        
        log_error "Backup failed for $environment"
        return 1
    fi
}

# Main backup function
perform_backup() {
    local environment=$1
    local backup_type=$2
    
    check_requirements
    
    if [[ "$environment" == "all" ]]; then
        log_info "Performing $backup_type backup for all environments..."
        
        local overall_success=0
        
        for env in staging production; do
            if [[ -f "$PROJECT_DIR/docker-compose.$env.yml" ]]; then
                if ! backup_environment "$env" "$backup_type"; then
                    overall_success=1
                fi
            else
                log_warning "Skipping $env - compose file not found"
            fi
        done
        
        if [[ $overall_success -eq 0 ]]; then
            log_success "All environment backups completed successfully"
        else
            log_error "Some environment backups failed"
            exit 1
        fi
    else
        backup_environment "$environment" "$backup_type"
    fi
}

# Main script logic
main() {
    local environment=${1:-production}
    local backup_type=${2:-manual}
    
    # Initialize logging
    init_log "$environment" "$backup_type"
    
    # Handle help
    if [[ "$environment" == "-h" ]] || [[ "$environment" == "--help" ]]; then
        show_help
        exit 0
    fi
    
    # Validate environment
    case "$environment" in
        staging|production|all)
            ;;
        *)
            log_error "Invalid environment: $environment"
            show_help
            exit 1
            ;;
    esac
    
    # Validate backup type
    case "$backup_type" in
        manual|daily|weekly|monthly)
            ;;
        *)
            log_error "Invalid backup type: $backup_type"
            show_help
            exit 1
            ;;
    esac
    
    # Perform backup
    perform_backup "$environment" "$backup_type"
    
    log_success "Backup operation completed"
    log_info "Backup log: backup.log"
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi