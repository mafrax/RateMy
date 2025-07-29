# RateMe - Modern Video Rating Platform

A modern full-stack web application built with **Next.js**, **PostgreSQL**, **Prisma**, and **NextAuth** for rating and discovering videos with community-driven tags and ratings.

## 🚀 Features

- **Modern Stack**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Authentication**: NextAuth.js with credential-based login
- **Database**: PostgreSQL with Prisma ORM
- **UI/UX**: Beautiful responsive design with Tailwind CSS and Headless UI
- **Real-time**: Socket.io integration for real-time features
- **Video Management**: Upload, categorize, and rate videos
- **Tag System**: Dynamic tagging with community ratings
- **Search**: Advanced search with tag filtering
- **User Profiles**: User management and following system

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **UI Components**: Headless UI, Heroicons
- **Styling**: Tailwind CSS with custom components
- **Real-time**: Socket.io
- **Form Handling**: React Hook Form
- **Notifications**: React Hot Toast

## 📋 Prerequisites

Before running this application, make sure you have:

- **Docker & Docker Compose** (recommended) OR
- **Node.js** (v18 or higher) + **PostgreSQL** database (v13 or higher)

## 🚀 Quick Start with Docker (Recommended)

### Option 1: Using Make Commands (Easiest)

```bash
# Clone the repository
git clone <repository-url>
cd RateMy

# Start the full application stack
make up

# Or start in development mode
make dev
```

### Option 2: Using Docker Compose Directly

```bash
# Clone the repository
git clone <repository-url>
cd RateMy

# Start the application (production mode)
docker-compose up -d

# Or start in development mode
docker-compose --profile dev up -d
```

**Access Points:**
- 🌐 **Production App**: http://localhost:3000
- 🛠 **Development App**: http://localhost:3001
- 🗄️ **Database**: localhost:5432

### Available Make Commands

```bash
make help      # Show all available commands
make build     # Build Docker images  
make up        # Start production mode
make dev       # Start development mode
make down      # Stop containers
make logs      # View logs
make clean     # Remove everything
make db-only   # Start only database
```

## 🛠 Manual Installation (Alternative)

If you prefer to run without Docker:

1. **Clone and install:**
```bash
git clone <repository-url>
cd RateMy
npm install
```

2. **Set up environment:**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. **Start PostgreSQL:**
```bash
docker run --name postgres-ratemy -e POSTGRES_DB=ratemy_db -e POSTGRES_USER=username -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15
```

4. **Set up database:**
```bash
npm run db:generate
npm run db:migrate
```

5. **Start development server:**
```bash
npm run dev
```

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx          # Home page
│   ├── providers.tsx     # React providers
│   └── auth/             # Authentication pages
├── components/            # Reusable React components
│   ├── Navbar.tsx
│   ├── VideoGrid.tsx
│   ├── VideoCard.tsx
│   └── ...
├── lib/                   # Utility libraries
│   ├── db.ts             # Prisma client
│   └── auth.ts           # NextAuth configuration
├── pages/api/            # API routes
│   ├── auth/
│   └── videos/
├── prisma/               # Database schema and migrations
│   └── schema.prisma
└── utils/                # Utility functions
```

## 🗄 Database Schema

The application uses PostgreSQL with these main entities:

- **Users**: User accounts with authentication
- **Videos**: Video entities with metadata
- **Tags**: Categories for video classification
- **Ratings**: User ratings for video-tag combinations
- **Follows**: User following relationships

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:migrate` - Run database migrations
- `npm run db:generate` - Generate Prisma client
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with sample data

## 🎨 UI Components

The application features a modern, responsive design with:

- **Clean Navigation**: Responsive navbar with user authentication
- **Hero Section**: Attractive landing area with call-to-action
- **Video Grid**: Responsive grid of video cards
- **Rating System**: Interactive star ratings for tags
- **Search**: Advanced search with tag filtering
- **Forms**: Beautiful forms with validation
- **Toast Notifications**: User feedback with react-hot-toast

## 🔐 Authentication

- **NextAuth.js** for secure authentication
- **Multiple providers**: Email/password, Google, Facebook, Apple OAuth
- **Session management** with database sessions
- **Protected routes** for authenticated features
- **User registration** with form validation

### OAuth Setup

To enable social login providers, you'll need to configure OAuth applications:

1. **Google**: Create OAuth app at https://console.developers.google.com/
2. **Facebook**: Create OAuth app at https://developers.facebook.com/
3. **Apple**: Create OAuth app at https://developer.apple.com/

Then update your `.env` file with the client IDs and secrets from each provider.

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/signin` - User sign in
- `POST /api/auth/signout` - User sign out

### Videos
- `GET /api/videos` - Get all videos with ratings
- `POST /api/videos` - Create new video (authenticated)
- `POST /api/videos/[id]/rate` - Rate a video (authenticated)

## 🔄 Real-time Features

Socket.io integration provides:
- Real-time rating updates
- Live user activity
- Instant notifications

## 🧪 Development

1. **Database Management:**
```bash
npm run db:studio  # Open Prisma Studio
npm run db:migrate # Apply schema changes
```

2. **Code Quality:**
```bash
npm run lint       # Check code quality
npm run type-check # TypeScript checking
```

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push

### Manual Deployment

1. **Build the application:**
```bash
npm run build
```

2. **Set production environment variables**

3. **Start the production server:**
```bash
npm start
```

## 📝 Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ratemy_db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Application
NODE_ENV="development"

# OAuth Providers (Optional - for social login)
# Google OAuth - Get from https://console.developers.google.com/
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Facebook OAuth - Get from https://developers.facebook.com/
FACEBOOK_CLIENT_ID="your-facebook-app-id"
FACEBOOK_CLIENT_SECRET="your-facebook-app-secret"

# Apple OAuth - Get from https://developer.apple.com/
APPLE_ID="your-apple-services-id"
APPLE_SECRET="your-apple-private-key-or-jwt"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env file
- Run `npm run db:migrate` to apply migrations

### Authentication Issues
- Check NEXTAUTH_SECRET is set
- Verify NEXTAUTH_URL matches your domain
- Clear browser cookies if needed

### Build Issues
- Run `npm run db:generate` after schema changes
- Clear `.next` folder and rebuild
- Check all environment variables are set

## 🎯 Future Enhancements

- Video upload with file handling
- Advanced search with filters
- User notifications
- Social features (comments, likes)
- Video recommendations
- Mobile app with React Native
- Video thumbnails generation
- Admin dashboard