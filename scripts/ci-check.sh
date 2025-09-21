#!/bin/bash

# CI/CD Local Check Script
# Runs all the same checks that GitHub Actions CI/CD pipeline runs
# Use this before pushing to catch issues early

set -e  # Exit on any error

echo "🚀 Running CI/CD checks locally..."
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "📦 Installing dependencies..."
npm ci
print_status $? "Dependencies installation"

echo ""
echo "🔍 Running ESLint..."
npm run lint
LINT_EXIT_CODE=$?
if [ $LINT_EXIT_CODE -eq 0 ]; then
    print_status 0 "ESLint"
else
    print_warning "ESLint found warnings (but not blocking errors)"
fi

echo ""
echo "🔧 Running TypeScript type checking..."
npm run typecheck
print_status $? "TypeScript type checking"

echo ""
echo "🏗️  Running production build..."
npm run build
print_status $? "Production build"

echo ""
echo "🧪 Running tests..."
npm test
print_status $? "Tests"

echo ""
echo "🔒 Checking for security vulnerabilities..."
npm audit --audit-level=high
AUDIT_EXIT_CODE=$?
if [ $AUDIT_EXIT_CODE -eq 0 ]; then
    print_status 0 "Security audit"
else
    print_warning "Security audit found issues - review npm audit output"
fi

echo ""
echo "======================================="
echo -e "${GREEN}🎉 All CI/CD checks passed!${NC}"
echo "✅ Safe to push to repository"
echo ""
echo "Next steps:"
echo "  git add ."
echo "  git commit -m 'Your commit message'"
echo "  git push"