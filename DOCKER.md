# Docker Setup Guide for RateMe

This document provides comprehensive instructions for running RateMe using Docker.

## 🐳 Docker Architecture

The application consists of two main services:

### Services
- **postgres**: PostgreSQL 15 database with persistent storage
- **app**: Next.js application (production build)
- **app-dev**: Next.js application (development mode with hot reload)

### Networks
- **ratemy-network**: Internal Docker network for service communication

### Volumes
- **postgres_data**: Persistent storage for PostgreSQL data

## 🚀 Quick Start Commands

### Using Make (Recommended)
```bash
# Show all available commands
make help

# Start production environment
make up

# Start development environment  
make dev

# View logs
make logs

# Stop everything
make down

# Clean up everything (containers, volumes, images)
make clean
```

### Using Docker Compose Directly
```bash
# Production mode
docker-compose up -d

# Development mode
docker-compose --profile dev up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f
```

## 🔧 Environment Configuration

### Production Environment Variables
The production container uses these environment variables:
- `NODE_ENV=production`
- `DATABASE_URL=postgresql://username:password@postgres:5432/ratemy_db`
- `NEXTAUTH_URL=http://localhost:3000`
- `NEXTAUTH_SECRET=your-super-secret-jwt-secret-change-in-production`

### Development Environment Variables
The development container uses:
- `NODE_ENV=development`
- `DATABASE_URL=postgresql://username:password@postgres:5432/ratemy_db`
- `NEXTAUTH_URL=http://localhost:3001`
- `NEXTAUTH_SECRET=your-super-secret-jwt-secret-change-in-production`

## 🏗 Build Process

### Production Build (Dockerfile)
The production build uses a multi-stage approach:
1. **deps**: Install production dependencies
2. **builder**: Generate Prisma client and build Next.js app
3. **runner**: Create minimal runtime image with non-root user

### Development Build (Dockerfile.dev)
The development build:
- Installs all dependencies including dev dependencies
- Mounts source code as volume for hot reload
- Runs `npm run dev` for development server

## 🗄️ Database Management

### Automatic Migrations
Both containers automatically run database migrations on startup:
```bash
npx prisma migrate deploy
```

### Manual Migration
If needed, you can run migrations manually:
```bash
# For running containers
make migrate

# Or directly
docker-compose exec app npx prisma migrate deploy
```

### Database Access
- **Host**: localhost
- **Port**: 5432
- **Database**: ratemy_db
- **Username**: username
- **Password**: password

### Prisma Studio
To access Prisma Studio for database management:
```bash
# Install Prisma CLI locally first
npm install -g prisma

# Then run Prisma Studio
npx prisma studio
```

## 📝 Available Services

### Production Mode (`make up`)
- **App**: http://localhost:3000
- **Database**: localhost:5432
- Optimized build with minimal image size
- Runs as non-root user for security

### Development Mode (`make dev`)
- **App**: http://localhost:3001
- **Database**: localhost:5432
- Hot reload enabled
- Development tools available
- Source code mounted as volume

### Database Only (`make db-only`)
- **Database**: localhost:5432
- Useful for local development without containers

## 🔍 Troubleshooting

### Common Issues

**Port conflicts:**
```bash
# Check what's using the ports
lsof -i :3000
lsof -i :5432

# Stop conflicting services
make down
```

**Build issues:**
```bash
# Clean rebuild
make clean
make build
make up
```

**Database connection issues:**
```bash
# Check database health
docker-compose ps postgres
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

**Permission issues:**
```bash
# The app runs as non-root user (nextjs:nodejs)
# If you have permission issues, check file ownership
```

### Logs and Debugging

**View all logs:**
```bash
make logs
```

**View specific service logs:**
```bash
docker-compose logs -f app
docker-compose logs -f postgres
```

**Execute commands in running containers:**
```bash
# Access app container
docker-compose exec app sh

# Access database
docker-compose exec postgres psql -U username -d ratemy_db
```

## 🚀 Production Deployment

### Environment Variables for Production
Create a `.env.production` file:
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@your-db-host:5432/ratemy_db
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-super-secure-secret-key
```

### Security Considerations
- Change default database credentials
- Use strong NEXTAUTH_SECRET
- Consider using Docker secrets for sensitive data
- Run behind reverse proxy (nginx) in production
- Enable SSL/TLS

### Scaling
To scale the application:
```bash
# Scale app instances
docker-compose up -d --scale app=3
```

Note: You'll need a load balancer (nginx) to distribute traffic.

## 📊 Monitoring

### Health Checks
The PostgreSQL service includes health checks:
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U username -d ratemy_db"]
  interval: 5s
  timeout: 5s
  retries: 5
```

### Resource Usage
Monitor container resource usage:
```bash
docker stats
```

## 🔄 Updates and Maintenance

### Updating the Application
```bash
# Pull latest changes
git pull

# Rebuild and restart
make clean
make build
make up
```

### Database Backups
```bash
# Create backup
docker-compose exec postgres pg_dump -U username ratemy_db > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U username ratemy_db < backup.sql
```

### Container Maintenance
```bash
# Remove unused containers and images
docker system prune -f

# Remove unused volumes (caution: this will delete data)
docker volume prune
```