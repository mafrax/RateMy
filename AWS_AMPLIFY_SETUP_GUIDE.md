# 🚀 AWS Amplify Deployment Guide

Complete step-by-step guide to deploy RateMe Next.js application to AWS Amplify.

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ AWS Account (free tier works)
- ✅ GitHub repository with your code
- ✅ Production database (AWS RDS or external PostgreSQL)

---

## 🎯 Step 1: AWS Console Setup

### 1.1 Access AWS Amplify
1. Go to [AWS Console](https://aws.amazon.com/console/)
2. Search for "Amplify" in the services search
3. Click on "AWS Amplify"
4. Click **"Get Started"** under "Amplify Hosting"

### 1.2 Connect GitHub Repository
1. Choose **"GitHub"** as your Git provider
2. Click **"Authorize AWS Amplify"** to connect your GitHub account
3. Select your repository: **"RateMy"**
4. Select branch: **"main"**
5. Click **"Next"**

---

## ⚙️ Step 2: Build Settings Configuration

### 2.1 Automatic Detection
AWS Amplify will automatically detect your `amplify.yml` file in the project root. This file contains:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
        - npx prisma generate
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

### 2.2 Manual Configuration (if needed)
If auto-detection fails, paste the above configuration in the "Build settings" section.

---

## 🔐 Step 3: Environment Variables Setup

### 3.1 Navigate to Environment Variables
In the Amplify Console:
1. Go to **"Environment variables"** tab
2. Click **"Manage variables"**

### 3.2 Add Required Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Sets production environment |
| `NEXTAUTH_SECRET` | `[Generate below]` | Authentication secret key |
| `DATABASE_URL` | `[Your database URL]` | PostgreSQL connection string |
| `NEXTAUTH_URL` | `[Will be provided by Amplify]` | Your app's production URL |

### 3.3 Generate NEXTAUTH_SECRET
Run this command locally to generate a secure secret:
```bash
openssl rand -base64 32
```
Copy the output and use it as your `NEXTAUTH_SECRET`.

### 3.4 Set Temporary NEXTAUTH_URL
For now, use a placeholder:
```
NEXTAUTH_URL = https://temp-placeholder.com
```
We'll update this with the actual Amplify URL after deployment.

---

## 🗄️ Step 4: Database Setup

Choose one of these options:

### Option A: AWS RDS PostgreSQL (Recommended)

1. **Create RDS Instance**:
   - AWS Console → RDS → "Create database"
   - Choose **PostgreSQL**
   - Select **"Free tier"** template
   - DB instance identifier: `ratemy-prod`
   - Master username: `ratemy_user`
   - Choose **"Auto generate password"**
   - Public access: **Yes** (for initial setup)
   - Create database

2. **Get Connection Details**:
   - Note the endpoint URL
   - Download the auto-generated password
   - Format: `postgresql://ratemy_user:password@endpoint:5432/postgres`

3. **Update DATABASE_URL**:
   ```
   DATABASE_URL = postgresql://ratemy_user:your_password@your-rds-endpoint.amazonaws.com:5432/postgres
   ```

### Option B: External Database (Supabase/Railway)

If you already have a PostgreSQL database:
1. Use your existing connection string
2. Update the `DATABASE_URL` environment variable
3. Ensure the database is accessible from AWS

---

## 🚀 Step 5: Deploy Application

### 5.1 Start Deployment
1. Review all settings in Amplify Console
2. Click **"Save and Deploy"**
3. Watch the build process (takes 3-5 minutes)

### 5.2 Monitor Build
The build process includes:
- **Provision**: Setting up build environment
- **Build**: Running npm install, Prisma generate, and build
- **Deploy**: Uploading to CDN
- **Verify**: Health checks

### 5.3 Get Your URL
Once deployed, you'll receive a URL like:
```
https://main.d1234567890.amplifyapp.com
```

---

## 🔧 Step 6: Update Configuration

### 6.1 Update NEXTAUTH_URL
1. Copy your actual Amplify URL
2. Go to Amplify Console → Environment variables
3. Update `NEXTAUTH_URL` with your real URL:
   ```
   NEXTAUTH_URL = https://main.d1234567890.amplifyapp.com
   ```
4. **Save** and **redeploy** the application

### 6.2 Update GitHub Secrets
For CI/CD to work properly, update your GitHub repository secrets:

1. Go to: GitHub Repository → **Settings** → **Secrets and variables** → **Actions**
2. Add/Update these secrets:

| Secret Name | Value |
|-------------|-------|
| `NEXTAUTH_SECRET` | Same as Amplify |
| `DATABASE_URL` | Same as Amplify |
| `NEXTAUTH_URL` | Your Amplify URL |

---

## 🎯 Step 7: Database Migration

### 7.1 Run Initial Migration
Once your app is deployed, you need to set up the database schema:

1. **Using Prisma Studio** (locally):
   ```bash
   # Connect to your production database
   DATABASE_URL="your-production-url" npx prisma migrate deploy
   ```

2. **Using Amplify Console** (recommended):
   - Go to Amplify Console → **Backend environments**
   - Add a backend environment
   - Connect your database
   - Run migrations through the console

---

## 🔍 Step 8: Testing and Verification

### 8.1 Test Core Functionality
Visit your deployed application and test:
- ✅ Home page loads
- ✅ User registration works
- ✅ User login works
- ✅ Video upload functionality
- ✅ Database connections

### 8.2 Monitor Performance
- Check Amplify Console → **Monitoring** for metrics
- Verify CDN is working (fast global load times)
- Test from different geographic locations

---

## 🛠️ Troubleshooting

### Common Issues and Solutions

#### Build Fails with "Invalid URL" Error
**Problem**: Missing or empty environment variables
**Solution**: 
1. Check all environment variables are set in Amplify Console
2. Ensure `NEXTAUTH_URL` is not empty
3. Redeploy after updating variables

#### Database Connection Failed
**Problem**: Database not accessible or wrong credentials
**Solution**:
1. Verify `DATABASE_URL` format: `postgresql://user:pass@host:port/db`
2. Check database security groups (AWS RDS)
3. Test connection locally first

#### Authentication Not Working
**Problem**: NextAuth configuration issues
**Solution**:
1. Verify `NEXTAUTH_SECRET` is set and strong
2. Ensure `NEXTAUTH_URL` matches your domain exactly
3. Check that callbacks are working

#### Build Takes Too Long
**Problem**: Slow dependency installation
**Solution**:
1. Verify `amplify.yml` has proper caching configured
2. Check for large dependencies that could be optimized
3. Review build logs for bottlenecks

---

## 🔄 Ongoing Operations

### Automatic Deployments
- **Trigger**: Every push to `main` branch
- **Process**: Automatic build and deploy
- **Rollback**: Available through Amplify Console

### Environment Management
- **Staging**: Create branch deployments for testing
- **Production**: Main branch auto-deploys
- **Feature**: Pull request previews available

### Monitoring
- **Metrics**: Available in Amplify Console
- **Logs**: Access build and runtime logs
- **Alerts**: Set up CloudWatch alerts for errors

---

## 📞 Support

### If You Need Help
1. **Build Issues**: Check Amplify Console build logs
2. **Database Issues**: Verify connection string and permissions
3. **Authentication Issues**: Check NextAuth configuration
4. **Performance Issues**: Review Amplify monitoring metrics

### Useful Resources
- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Prisma Production Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides)

---

## 💰 Cost Estimation

### AWS Amplify Pricing (Free Tier)
- **Build minutes**: 1,000 minutes/month (free)
- **Data served**: 15 GB/month (free)
- **Requests**: Unlimited (free)

### AWS RDS Free Tier
- **Instance**: db.t3.micro (free for 12 months)
- **Storage**: 20 GB (free)
- **Backup**: 20 GB (free)

### After Free Tier
- **Amplify**: ~$1-5/month for small applications
- **RDS**: ~$15-30/month for small database

---

## ✅ Deployment Checklist

- [ ] AWS Account created and verified
- [ ] GitHub repository connected to Amplify
- [ ] Environment variables configured
- [ ] Database created and accessible
- [ ] Application deployed successfully
- [ ] NEXTAUTH_URL updated with real domain
- [ ] GitHub secrets updated
- [ ] Database migrations completed
- [ ] Core functionality tested
- [ ] Domain configured (optional)
- [ ] SSL certificate verified
- [ ] Monitoring set up

---

**🎉 Congratulations!** Your RateMe application is now deployed on AWS Amplify with a production-ready setup including CDN, automatic HTTPS, and scalable infrastructure.