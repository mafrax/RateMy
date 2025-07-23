# RateMe Docker Commands

.PHONY: help build up down logs clean restart dev prod

# Default help
help:
	@echo "Available commands:"
	@echo "  build     - Build Docker images"
	@echo "  up        - Start the application in production mode"
	@echo "  dev       - Start the application in development mode"
	@echo "  down      - Stop and remove containers"
	@echo "  logs      - View application logs"
	@echo "  clean     - Remove containers, volumes, and images"
	@echo "  restart   - Restart the application"
	@echo "  db-only   - Start only the PostgreSQL database"
	@echo "  migrate   - Run database migrations"

# Build images
build:
	docker-compose build --no-cache

# Start in production mode
up:
	docker-compose up -d
	@echo "Application starting..."
	@echo "🌐 App: http://localhost:3000"
	@echo "🗄️  Database: localhost:5432"

# Start in development mode  
dev:
	docker-compose --profile dev up -d
	@echo "Development server starting..."
	@echo "🌐 App: http://localhost:3001"
	@echo "🗄️  Database: localhost:5432"

# Stop containers
down:
	docker-compose down

# View logs
logs:
	docker-compose logs -f

# Clean everything
clean:
	docker-compose down -v --rmi all --remove-orphans
	docker system prune -f

# Restart
restart: down up

# Start only database
db-only:
	docker-compose up -d postgres
	@echo "🗄️  PostgreSQL started on localhost:5432"

# Run migrations manually
migrate:
	docker-compose exec app npx prisma migrate deploy

# Check status
status:
	docker-compose ps