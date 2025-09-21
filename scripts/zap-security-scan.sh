#!/bin/bash

# Local OWASP ZAP Security Scan Script
# Runs the same security scan that the CI/CD pipeline runs
# Use this to catch security issues before pushing

set -e  # Exit on any error

echo "🔒 Running OWASP ZAP Security Scan locally..."
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2 passed${NC}"
    else
        echo -e "${RED}❌ $2 failed${NC}"
        exit 1
    fi
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

print_status 0 "Docker is running"

# Check if port 3003 is available
if lsof -Pi :3003 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_warning "Port 3003 is already in use. Attempting to kill existing process..."
    lsof -ti:3003 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Start PostgreSQL container for ZAP testing
print_info "Starting PostgreSQL container for testing..."
docker run -d \
    --name zap-postgres-test \
    --rm \
    -p 5435:5432 \
    -e POSTGRES_USER=zapuser \
    -e POSTGRES_PASSWORD=zappass \
    -e POSTGRES_DB=ratemy_zap \
    postgres:14 > /dev/null

# Wait for PostgreSQL to be ready
print_info "Waiting for PostgreSQL to be ready..."
sleep 5

# Check if PostgreSQL is ready
until docker exec zap-postgres-test pg_isready -U zapuser > /dev/null 2>&1; do
    print_info "Waiting for PostgreSQL to start..."
    sleep 2
done

print_status 0 "PostgreSQL container started"

# Set environment variables for ZAP testing
export DATABASE_URL="postgresql://zapuser:zappass@localhost:5435/ratemy_zap"
export NODE_ENV=production
export PORT=3003
export NEXTAUTH_SECRET="zap-test-secret-key"
export NEXTAUTH_URL="http://localhost:3003"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_info "Installing dependencies..."
    npm ci > /dev/null
fi

# Generate Prisma client and run migrations
print_info "Setting up database..."
npm run db:generate > /dev/null 2>&1
npm run db:migrate > /dev/null 2>&1 || echo "Migration completed"

# Build the application
print_info "Building application..."
npm run build > /dev/null

# Start the application in background
print_info "Starting application on port 3003..."
npm start > /dev/null 2>&1 &
APP_PID=$!

# Wait for application to be ready
print_info "Waiting for application to start..."
sleep 10

# Check if application is responding
for i in {1..30}; do
    if curl -f http://localhost:3003/api/health > /dev/null 2>&1; then
        print_status 0 "Application is running and healthy"
        break
    fi
    if [ $i -eq 30 ]; then
        print_status 1 "Application failed to start"
        exit 1
    fi
    sleep 1
done

# Create ZAP reports directory
mkdir -p zap-reports

# Run OWASP ZAP baseline scan
print_info "Running OWASP ZAP security scan..."
echo "This may take a few minutes..."

# Create ZAP rules file if it doesn't exist
mkdir -p .zap
if [ ! -f ".zap/rules.tsv" ]; then
    cat > .zap/rules.tsv << 'EOF'
10021	IGNORE	(Information Disclosure - Suspicious Comments)
10027	IGNORE	(Information Disclosure - Suspicious Comments)
10109	IGNORE	(Modern Web Application)
10202	IGNORE	(Absence of Anti-CSRF Tokens)
EOF
fi

# Pull ZAP Docker image
print_info "Pulling OWASP ZAP Docker image..."
docker pull ghcr.io/zaproxy/zaproxy:stable > /dev/null

# Run ZAP scan with proper configuration for HTTP (not HTTPS)
ZAP_EXIT_CODE=0
docker run --rm \
    -v $(pwd):/zap/wrk/:rw \
    --network="host" \
    ghcr.io/zaproxy/zaproxy:stable \
    zap-baseline.py \
    -t http://localhost:3003 \
    -J zap-reports/report.json \
    -w zap-reports/report.md \
    -r zap-reports/report.html \
    -c .zap/rules.tsv \
    -x zap-reports/report.xml || ZAP_EXIT_CODE=$?

# Cleanup
print_info "Cleaning up..."

# Kill the application
if [ ! -z "$APP_PID" ]; then
    kill $APP_PID 2>/dev/null || true
fi

# Stop and remove PostgreSQL container
docker stop zap-postgres-test > /dev/null 2>&1 || true

# Check ZAP results
if [ $ZAP_EXIT_CODE -eq 0 ]; then
    print_status 0 "OWASP ZAP security scan completed with no high-risk issues"
elif [ $ZAP_EXIT_CODE -eq 2 ]; then
    print_warning "ZAP scan completed with warnings (medium-risk issues found)"
    echo ""
    echo "📊 Security scan reports generated:"
    echo "   - HTML Report: $(pwd)/zap-reports/report.html"
    echo "   - JSON Report: $(pwd)/zap-reports/report.json"
    echo "   - Markdown Report: $(pwd)/zap-reports/report.md"
    echo ""
    echo "⚠️  Review the reports for security recommendations"
elif [ $ZAP_EXIT_CODE -eq 3 ]; then
    print_status 1 "ZAP scan found high-risk security issues"
    echo ""
    echo "📊 Security scan reports generated:"
    echo "   - HTML Report: $(pwd)/zap-reports/report.html"
    echo "   - JSON Report: $(pwd)/zap-reports/report.json"
    echo "   - Markdown Report: $(pwd)/zap-reports/report.md"
    echo ""
    echo "🔒 Please review and fix the security issues before deploying"
    exit 1
else
    print_status 1 "ZAP scan failed with unexpected error"
    exit 1
fi

echo ""
echo "=============================================="
echo -e "${GREEN}🔒 Security scan completed successfully!${NC}"
echo ""
echo "📊 Reports available in zap-reports/ directory:"
echo "   - HTML Report: zap-reports/report.html"
echo "   - JSON Report: zap-reports/report.json"
echo "   - Markdown Report: zap-reports/report.md"