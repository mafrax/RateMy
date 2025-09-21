# Local Development Scripts

This directory contains scripts to run CI/CD checks locally, preventing pipeline failures and improving development efficiency.

## 🚀 CI/CD Check Script

**`npm run ci-check`** - Runs all CI/CD pipeline checks locally

### What it checks:
- ✅ Dependencies installation (`npm ci`)
- ✅ ESLint linting (`npm run lint`)
- ✅ TypeScript type checking (`npm run typecheck`)
- ✅ Production build (`npm run build`)
- ✅ Test suite (`npm test`)
- ✅ Security audit (`npm audit`)

### Usage:
```bash
# Basic CI/CD checks (recommended before every push)
npm run ci-check

# Include OWASP ZAP security scan (takes 5-10 minutes extra)
npm run ci-check -- --security-scan
```

## 🔒 Security Scan Script

**`npm run security-scan`** - Runs OWASP ZAP security testing

### What it does:
- Starts a PostgreSQL test database
- Builds and runs the application in production mode
- Performs comprehensive security scanning with OWASP ZAP
- Generates detailed security reports

### Requirements:
- Docker must be running
- Ports 3003 and 5435 must be available

### Usage:
```bash
# Run standalone security scan
npm run security-scan

# Or include it in CI checks
npm run ci-check -- --security-scan
```

### Reports Generated:
- `zap-reports/report.html` - Detailed HTML report
- `zap-reports/report.json` - Machine-readable JSON data
- `zap-reports/report.md` - Markdown summary
- `zap-reports/report.xml` - XML format for CI/CD integration

## 🎯 Recommended Workflow

### Before every commit:
```bash
npm run ci-check
```

### Before major releases or security-sensitive changes:
```bash
npm run ci-check -- --security-scan
```

### If CI checks pass:
```bash
git add .
git commit -m "Your commit message"
git push
```

## 🛠️ Troubleshooting

### Common Issues:

**Port conflicts:**
- ZAP scan uses ports 3003 and 5435
- Regular development uses port 3000
- Scripts will attempt to kill conflicting processes

**Docker not running:**
- Security scan requires Docker for PostgreSQL and ZAP
- Start Docker Desktop and try again

**Permission errors:**
- Make sure scripts are executable: `chmod +x scripts/*.sh`

**Out of disk space:**
- ZAP downloads ~500MB Docker image on first run
- Reports are generated in `zap-reports/` directory

### Getting Help:

1. Check script output for specific error messages
2. Review generated reports in `zap-reports/` directory
3. Ensure all prerequisites (Docker, Node.js, npm) are installed
4. Try running individual commands from the scripts manually

## 📊 Security Scan Exit Codes

- **0**: No security issues found ✅
- **2**: Medium-risk issues found ⚠️ (warnings)
- **3**: High-risk issues found ❌ (must fix)
- **Other**: Scan failed due to technical issues

## 🔧 Customization

### ZAP Rules Configuration:
Edit `.zap/rules.tsv` to customize which security checks to ignore:

```tsv
10021	IGNORE	(Information Disclosure - Suspicious Comments)
10027	IGNORE	(Information Disclosure - Suspicious Comments)
# Add more rules as needed
```

### Environment Variables:
Security scan uses these test environment variables:
- `DATABASE_URL`: Points to test PostgreSQL container
- `NODE_ENV=production`: Runs in production mode
- `PORT=3003`: Uses different port to avoid conflicts
- `NEXTAUTH_SECRET`: Test authentication secret

## 💡 Tips

1. **Run ci-check before every push** to catch issues early
2. **Include security scans for security-sensitive features** like authentication
3. **Review security reports** even if scan passes - warnings may indicate improvements
4. **Keep ZAP rules updated** as your application security requirements evolve
5. **Use in CI/CD pipeline** - these scripts mirror your GitHub Actions exactly