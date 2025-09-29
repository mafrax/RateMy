# 🛠️ Development Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Git

### Setup Steps
```bash
# 1. Clone repository
git clone https://github.com/your-username/RateMy.git
cd RateMy

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your values

# 4. Set up database
npm run db:migrate
npm run db:generate

# 5. Start development server
npm run dev:safe
```

## 📁 Project Architecture

### Tech Stack
- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Headless UI
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Testing**: Playwright (E2E), Jest (Unit)

### Code Organization
```
src/
├── types/           # TypeScript definitions
├── lib/            # Utilities and configuration
├── services/       # Business logic
├── repositories/   # Data access layer
└── validation/     # Zod schemas
```

## 🔧 Development Commands

### Core Commands
```bash
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint
npm run typecheck       # Check TypeScript
```

### Database Commands
```bash
npm run db:migrate      # Run database migrations
npm run db:generate     # Generate Prisma client
npm run db:studio       # Open Prisma Studio
npm run db:seed         # Seed database with test data
```

### Testing Commands
```bash
npm run test:ui         # Run E2E tests (Chromium + Firefox)
npm run test:ui:all     # Run all browser tests including WebKit
npm run test:ui:headed  # Run tests with browser UI
npm run test:ui:debug   # Debug tests interactively
```

## 🎯 Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes
# ... code ...

# Run tests
npm run test:ui
npm run lint

# Commit changes
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/your-feature-name
```

### 2. Code Quality
- **ESLint**: Enforces code style and catches errors
- **TypeScript**: Provides type safety
- **Prettier**: Code formatting (via ESLint)
- **Husky**: Git hooks for pre-commit checks

### 3. Testing Strategy
- **E2E Tests**: Test user workflows with Playwright
- **Unit Tests**: Test individual functions with Jest
- **Integration Tests**: Test API endpoints and database

## 🌍 Environment Variables

### Required Variables
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ratemy_dev

# Authentication
NEXTAUTH_SECRET=your-super-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Optional
NODE_ENV=development
```

### Environment Files
- `.env` - Local development (not committed)
- `.env.example` - Template with all variables
- `.env.production` - Production template

## 🐞 Debugging

### Development Server Issues
```bash
# Clear Next.js cache
rm -rf .next

# Clear node modules
rm -rf node_modules package-lock.json
npm install

# Check port availability
npm run network-diag
```

### Database Issues
```bash
# Reset database
npm run db:migrate reset

# Check connection
npm run db:studio
```

### Build Issues
```bash
# Check TypeScript errors
npm run typecheck

# Check for missing dependencies
npm audit

# Verbose build output
npm run build -- --debug
```

## 📊 Performance Tips

### Development
- Use `npm run dev:safe` for enhanced startup checks
- Enable React DevTools for component debugging
- Use Prisma Studio for database debugging

### Production
- Run `npm run build` to check for build errors
- Use `npm run start` to test production build locally
- Monitor build times with verbose output

## 🔐 Security Guidelines

### Environment Variables
- Never commit `.env` files
- Use strong secrets for production
- Rotate secrets regularly

### Dependencies
- Run `npm audit` regularly
- Keep dependencies updated
- Review dependency licenses

### Code Practices
- Validate all user inputs with Zod schemas
- Sanitize database queries (Prisma handles this)
- Use TypeScript for type safety
- Follow security headers in middleware

## 🤝 Contributing

### Code Style
- Use TypeScript for all new code
- Follow existing naming conventions
- Add types for all functions and components
- Write tests for new features

### Git Workflow
- Use conventional commits: `feat:`, `fix:`, `docs:`
- Keep commits focused and atomic
- Write clear commit messages
- Squash commits before merging

### Pull Requests
- Include tests for new features
- Update documentation as needed
- Ensure all CI checks pass
- Request review from team members