# 🎬 RateMe - Video Rating Platform

A modern full-stack video rating platform built with **Next.js 14**, **PostgreSQL**, and **TypeScript**. Rate, discover, and organize videos with community-driven tags and ratings.

## ✨ Key Features

- 🎥 **Video Management** - Upload, categorize, and rate videos
- 🏷️ **Smart Tagging** - Dynamic tagging with community ratings  
- 🔍 **Advanced Search** - Filter by tags, ratings, and categories
- 👤 **User Profiles** - User management and social features
- 🎨 **Modern UI** - Responsive design with Tailwind CSS
- 🔐 **Secure Auth** - NextAuth.js authentication system

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL with Prisma
- **Authentication**: NextAuth.js
- **Testing**: Playwright (E2E), Jest (Unit)
- **Deployment**: AWS Amplify ready

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Git

### Setup
```bash
# 1. Clone and install
git clone <repository-url>
cd RateMy
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your database URL and secrets

# 3. Setup database
npm run db:migrate
npm run db:generate

# 4. Start development server
npm run dev:safe
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📚 Documentation

| Topic | Description | Link |
|-------|-------------|------|
| 🚀 **Deployment** | Complete AWS Amplify setup guide | [AWS_AMPLIFY_SETUP_GUIDE.md](./AWS_AMPLIFY_SETUP_GUIDE.md) |
| 🛠️ **Development** | Development workflow and commands | [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) |
| 🧪 **Testing** | E2E and unit testing guide | [docs/TESTING.md](./docs/TESTING.md) |
| 🔌 **API** | API endpoints and usage | [docs/API.md](./docs/API.md) |
| 📁 **Structure** | Project organization guide | [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) |
| 🚫 **WebKit Issue** | Browser compatibility notes | [WEBKIT_ISSUE.md](./WEBKIT_ISSUE.md) |

## 💻 Development Commands

```bash
# Development
npm run dev              # Start development server
npm run dev:safe         # Start with enhanced checks
npm run build           # Build for production

# Database
npm run db:migrate      # Run database migrations
npm run db:generate     # Generate Prisma client
npm run db:studio       # Open database browser

# Testing
npm run test:ui         # Run E2E tests (Chromium + Firefox)
npm run test:ui:headed  # Run tests with browser UI
npm run lint            # Check code quality
```

## 🏗️ Project Architecture

```
├── 📁 app/              # Next.js App Router pages
├── 📁 components/       # React components  
├── 📁 src/             # Source code (services, libs, types)
├── 📁 prisma/          # Database schema and migrations
├── 📁 tests/           # E2E and unit tests
├── 📁 docs/            # Documentation
└── 📁 .github/         # CI/CD workflows
```

## 🚀 Deployment

### AWS Amplify (Recommended)
1. Follow the complete guide: [AWS_AMPLIFY_SETUP_GUIDE.md](./AWS_AMPLIFY_SETUP_GUIDE.md)
2. Connect your GitHub repository
3. Set environment variables
4. Deploy automatically

### Environment Variables
Required for production:
```bash
NEXTAUTH_SECRET=your-secret-key
DATABASE_URL=postgresql://user:pass@host:5432/db
NEXTAUTH_URL=https://your-domain.com
```

## 🧪 Testing

- **E2E Tests**: 42/42 passing with Playwright
- **Cross-browser**: Chromium and Firefox support
- **CI/CD**: Automated testing on every push
- **Coverage**: Authentication, navigation, and core features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run tests: `npm run test:ui && npm run lint`
5. Commit: `git commit -m 'feat: add amazing feature'`
6. Push and create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- 📖 **Documentation**: Check the `/docs` folder for detailed guides
- 🐛 **Issues**: Report bugs via GitHub Issues  
- 💬 **Discussions**: Use GitHub Discussions for questions
- 📧 **Contact**: [your-email@example.com]

---

**Built with ❤️ using Next.js, TypeScript, and modern web technologies.**