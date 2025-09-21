# Docker Deployment Guide

## 🚀 Quick Start

### 1. Setup Environment Variables
```bash
# Copy the example environment file
cp .env.docker.example .env.docker

# Edit the file and fill in secure values
nano .env.docker
```

### 2. Generate Secure Secrets
```bash
# Generate secure PostgreSQL password
openssl rand -base64 32

# Generate secure NextAuth secret (minimum 32 characters)
openssl rand -base64 32
```

### 3. Deploy
```bash
# Production deployment
docker-compose --env-file .env.docker up -d

# Development deployment
docker-compose --env-file .env.docker --profile dev up -d
```

## 🔒 Security Configuration

### Required Environment Variables
- `POSTGRES_PASSWORD`: Secure database password
- `NEXTAUTH_SECRET`: JWT signing secret (32+ characters)
- `DATABASE_URL`: Complete database connection string

### Security Best Practices
1. **Never commit .env.docker** to version control
2. **Use different secrets** for each environment
3. **Rotate secrets regularly** in production
4. **Use managed secret services** (AWS Secrets Manager) in production

## 🏗️ Deployment Environments

### Development
```bash
docker-compose --env-file .env.docker --profile dev up
```
- Runs on port 3001
- Hot reload enabled
- Development database

### Production
```bash
docker-compose --env-file .env.docker up -d
```
- Runs on port 3000
- Optimized build
- Production database

## 🔧 Troubleshooting

### Health Checks
- Database: `docker exec ratemy-postgres pg_isready`
- Application: `curl http://localhost:3000/api/health`

### Logs
```bash
# View application logs
docker logs ratemy-app

# View database logs
docker logs ratemy-postgres

# Follow logs in real-time
docker-compose logs -f
```

### Common Issues
1. **Connection refused**: Check if DATABASE_URL matches container credentials
2. **Authentication failed**: Verify POSTGRES_PASSWORD in .env.docker
3. **Port conflicts**: Ensure ports 3000/3001 and 5433 are available

## 📝 Environment File Template

Create `.env.docker` with these variables:
```bash
# Database
POSTGRES_DB=ratemy_db
POSTGRES_USER=ratemy_user
POSTGRES_PASSWORD=<SECURE_32_CHAR_PASSWORD>

# Application
DATABASE_URL=postgresql://ratemy_user:<PASSWORD>@postgres:5432/ratemy_db
NEXTAUTH_SECRET=<SECURE_32_CHAR_SECRET>
NEXTAUTH_URL=http://localhost:3000

# Optional
LOG_LEVEL=info
```

## 🔄 Production Deployment Checklist

- [ ] Secure environment variables configured
- [ ] Database password is strong (32+ characters)
- [ ] NextAuth secret is unique and secure
- [ ] .env.docker is not committed to git
- [ ] Health checks are passing
- [ ] Logs are being collected
- [ ] Backup strategy is in place