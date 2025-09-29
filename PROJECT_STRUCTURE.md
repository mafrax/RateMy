# 📁 RateMe Project Structure

## 🎯 Root Directory Organization

```
RateMe/
├── 📄 README.md                    # Project overview and getting started
├── 📄 CLAUDE.md                    # Claude Code assistant instructions
├── 📄 AWS_AMPLIFY_SETUP_GUIDE.md  # Complete deployment guide
├── 📄 WEBKIT_ISSUE.md              # WebKit testing compatibility notes
├── 📄 PROJECT_STRUCTURE.md         # This file - project organization
│
├── 📁 docs/                        # Documentation (to be created)
│   ├── API.md                      # API documentation
│   ├── DEPLOYMENT.md              # Deployment guides
│   ├── DEVELOPMENT.md             # Development setup
│   └── TESTING.md                 # Testing guidelines
│
├── 📁 app/                         # Next.js App Router pages
├── 📁 components/                  # React components
├── 📁 src/                         # Source code (services, libs, types)
├── 📁 prisma/                      # Database schema and migrations
├── 📁 tests/                       # Test files (E2E and unit)
├── 📁 scripts/                     # Utility scripts
├── 📁 .github/                     # GitHub workflows and templates
│
├── ⚙️ Configuration Files
├── 📄 package.json                 # Dependencies and scripts
├── 📄 next.config.js              # Next.js configuration
├── 📄 tailwind.config.js          # Tailwind CSS config
├── 📄 playwright.config.ts        # E2E testing config
├── 📄 amplify.yml                 # AWS Amplify build config
├── 📄 middleware.ts               # Next.js middleware
├── 📄 .env.example                # Environment variables template
├── 📄 .env.production             # Production env template
├── 📄 .gitignore                  # Git ignore rules
└── 📄 tsconfig.json               # TypeScript configuration
```

## 🗂️ Detailed Directory Structure

### **📁 Core Application**
```
app/                    # Next.js 14 App Router
├── layout.tsx         # Root layout component
├── page.tsx           # Home page
├── globals.css        # Global styles
├── providers.tsx      # React context providers
├── auth/              # Authentication pages
│   ├── signin/page.tsx
│   └── signup/page.tsx
├── upload/page.tsx    # Video upload page
├── profile/page.tsx   # User profile page
├── admin/             # Admin pages
└── api/               # API routes (if any)

components/            # Reusable React components
├── Navbar.tsx         # Navigation component
├── VideoCard.tsx      # Video display component
├── VideoGrid.tsx      # Video listing grid
├── SearchBar.tsx      # Search functionality
├── ThemeToggle.tsx    # Dark/light mode toggle
└── ui/                # UI components

src/                   # Source code organization
├── types/             # TypeScript type definitions
├── lib/               # Utility libraries
│   ├── config.ts      # Environment configuration
│   ├── constants.ts   # Application constants
│   ├── database.ts    # Database client
│   ├── validation.ts  # Zod validation schemas
│   └── errors.ts      # Custom error classes
├── services/          # Business logic layer
│   ├── auth.service.ts
│   ├── video.service.ts
│   └── user.service.ts
└── repositories/      # Data access layer
    ├── base.repository.ts
    ├── user.repository.ts
    └── video.repository.ts
```

### **📁 Database & Testing**
```
prisma/                # Database management
├── schema.prisma      # Database schema
├── migrations/        # Database migrations
└── seed.js           # Database seeding script

tests/                 # Test suites
├── e2e/              # End-to-end tests (Playwright)
│   ├── auth.spec.ts  # Authentication tests
│   └── home-page.spec.ts # Home page tests
├── unit/             # Unit tests (Jest)
└── fixtures/         # Test data
```

### **📁 DevOps & Configuration**
```
.github/              # GitHub configuration
├── workflows/        # CI/CD pipelines
│   ├── ci.yml       # Continuous integration
│   ├── deploy.yml   # Deployment pipeline
│   └── security.yml # Security scanning
└── ISSUE_TEMPLATE/   # Issue templates

scripts/              # Utility scripts
├── startup.js        # Development startup script
├── network-diag.js   # Network diagnostics
└── deploy/           # Deployment scripts
```

## 🎯 File Categories

### **📚 Documentation Files**
- `README.md` - Project overview, quick start guide
- `CLAUDE.md` - Instructions for Claude Code assistant
- `AWS_AMPLIFY_SETUP_GUIDE.md` - Complete deployment guide
- `WEBKIT_ISSUE.md` - WebKit browser testing notes
- `PROJECT_STRUCTURE.md` - This file

### **⚙️ Configuration Files**
- `package.json` - Dependencies and npm scripts
- `next.config.js` - Next.js framework configuration
- `tailwind.config.js` - CSS framework configuration
- `playwright.config.ts` - E2E testing configuration
- `amplify.yml` - AWS Amplify build configuration
- `middleware.ts` - Next.js middleware for security headers
- `tsconfig.json` - TypeScript compiler configuration

### **🔐 Environment Files**
- `.env` - Local development variables (not committed)
- `.env.example` - Template for environment variables
- `.env.production` - Production environment template
- `.gitignore` - Files to exclude from Git

### **🏗️ Build & Runtime Files**
- `.next/` - Next.js build output (auto-generated)
- `node_modules/` - Dependencies (auto-generated)
- `test-results/` - Playwright test results (auto-generated)
- `playwright-report/` - Test reports (auto-generated)

## 📋 Quick Navigation Guide

### **🚀 Getting Started**
1. Read `README.md` for project overview
2. Check `package.json` for available scripts
3. Review `.env.example` for required environment variables
4. Follow setup instructions in `CLAUDE.md`

### **🛠️ Development**
- **Source Code**: `src/` directory contains all business logic
- **Components**: `components/` for React components
- **Pages**: `app/` for Next.js App Router pages
- **Database**: `prisma/` for schema and migrations
- **Tests**: `tests/` for all testing files

### **🚀 Deployment**
- **AWS Amplify**: Follow `AWS_AMPLIFY_SETUP_GUIDE.md`
- **Configuration**: `amplify.yml` and `next.config.js`
- **CI/CD**: `.github/workflows/` for automated pipelines
- **Environment**: `.env.production` for production variables

### **🧪 Testing**
- **E2E Tests**: `tests/e2e/` directory
- **Configuration**: `playwright.config.ts`
- **Scripts**: `npm run test:ui` for UI tests
- **Reports**: `playwright-report/` for test results

### **📊 Monitoring**
- **Logs**: Check CI/CD workflows in `.github/workflows/`
- **Health**: `/api/health` endpoint for application status
- **Scripts**: `scripts/` directory for diagnostic tools

## 💡 Best Practices

### **📁 File Organization**
- Keep related files together in logical directories
- Use descriptive names for files and folders
- Separate concerns (components, services, types)
- Group by feature rather than file type where appropriate

### **📝 Documentation**
- Update documentation when making significant changes
- Keep README.md current with setup instructions
- Document environment variables in `.env.example`
- Maintain deployment guides for different platforms

### **🔧 Configuration**
- Use configuration files for environment-specific settings
- Keep sensitive data in environment variables
- Document all configuration options
- Use TypeScript for type safety in configuration

This organization makes the project easy to navigate and maintain for both development and deployment purposes.