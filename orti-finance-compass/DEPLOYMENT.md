# 🚀 Deployment Guide for Finanza React App

This guide explains how to deploy the Finanza React App to Cloudflare Pages using our multi-environment deployment system.

## 📋 Table of Contents

- [Overview](#overview)
- [Environments](#environments)
- [Deployment Methods](#deployment-methods)
- [Initial Setup](#initial-setup)
- [Branch Strategy](#branch-strategy)
- [Troubleshooting](#troubleshooting)

## Overview

We use Cloudflare Pages for hosting with automatic deployments configured through GitHub Actions. The system supports multiple environments with different deployment strategies.

### Key Features

- **Automatic deployments** on push to specific branches
- **Preview deployments** for all pull requests
- **Branch-based environments** (production, staging, development)
- **Automatic cache purging** for production deployments
- **Safe deployment testing** from feature branches

## Environments

| Environment | Branch | URL | Auto Deploy | Cache Purge |
|------------|--------|-----|-------------|-------------|
| Production | `main` | https://finanza-react-app.pages.dev | ✅ | ✅ |
| Staging | `staging` | https://staging.finanza-react-app.pages.dev | ✅ | ❌ |
| Development | `develop` | https://develop.finanza-react-app.pages.dev | ✅ | ❌ |
| Preview | `feature/*` | https://[branch-name].finanza-react-app.pages.dev | ✅ (PR only) | ❌ |

## Deployment Methods

### 1. Automatic Deployment (Recommended)

Simply push to the appropriate branch:

```bash
# Deploy to production
git checkout main
git merge your-feature-branch
git push

# Deploy to staging
git checkout staging
git merge your-feature-branch
git push
```

### 2. Manual Deployment from Current Branch

Use the provided script to deploy any branch:

```bash
cd orti-finance-compass
./deploy-branch.sh
```

This script will:
- Check for uncommitted changes
- Build the project
- Deploy to a preview URL based on your branch name
- Provide the deployment URL

### 3. GitHub Actions Manual Trigger

1. Go to the repository's Actions tab
2. Select "Manual Deploy to Cloudflare"
3. Click "Run workflow"
4. Choose your options:
   - Branch to deploy
   - Whether to purge cache
   - Target environment

### 4. Local Deployment with Cache Purge

For production deployments with cache control:

```bash
cd orti-finance-compass
./deploy-and-purge.sh --env production --purge
```

## Initial Setup

### Prerequisites

1. **Cloudflare Account** with Pages enabled
2. **GitHub Repository** with push access
3. **Node.js 20+** installed locally

### Step 1: Configure GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets → Actions):

| Secret Name | Description | Where to Find |
|------------|-------------|---------------|
| `CLOUDFLARE_API_TOKEN` | API token with Pages and Cache permissions | [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens) |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID | Dashboard → Right sidebar |
| `CLOUDFLARE_ZONE_ID` | Your domain's zone ID | Domain overview → Right sidebar |

### Step 2: Set Up Local Environment (Optional)

For local deployments, create `.env.local`:

```bash
cd orti-finance-compass
cp .env.local.example .env.local
# Edit .env.local with your Cloudflare credentials
```

### Step 3: Verify Wrangler Authentication

```bash
cd orti-finance-compass
npx wrangler whoami
```

If not authenticated:
```bash
npx wrangler login
```

## Branch Strategy

### Recommended Git Flow

```
main (production)
  ├── staging
  │     └── develop
  │           └── feature/your-feature
  └── hotfix/urgent-fix
```

### Creating a Feature Branch

```bash
# Start from develop
git checkout develop
git pull origin develop
git checkout -b feature/your-feature

# Make changes and test locally
npm run dev

# Deploy preview
./deploy-branch.sh

# Create PR when ready
git push -u origin feature/your-feature
```

### Deployment Flow

1. **Feature Development**: Work on `feature/*` branches
2. **Preview**: Automatic deployment on PR creation
3. **Testing**: Merge to `develop` for development environment testing
4. **Staging**: Merge to `staging` for pre-production testing
5. **Production**: Merge to `main` for production deployment

## Troubleshooting

### Common Issues

#### Build Fails on Cloudflare

```bash
# Test build locally
npm run build

# Check for TypeScript errors
npm run lint
```

#### Cache Not Updating

1. **Quick Fix**: Enable Development Mode in Cloudflare dashboard
2. **Manual Purge**: 
   ```bash
   ./deploy-and-purge.sh --purge
   ```
3. **Browser**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

#### Preview URL Not Working

- Check branch name doesn't contain invalid characters
- Verify deployment in Cloudflare dashboard
- Wait 1-2 minutes for DNS propagation

#### Deployment Permissions Error

Verify your Cloudflare API token has these permissions:
- Zone → Zone:Read, Cache Purge:Edit
- Account → Cloudflare Pages:Edit

### Debug Commands

```bash
# List all deployments
npx wrangler pages deployment list --project-name=finanza-react-app

# Check project details
npx wrangler pages project list

# View deployment logs
npx wrangler pages deployment tail --project-name=finanza-react-app
```

### Getting Help

1. Check deployment logs in GitHub Actions
2. Review Cloudflare Pages dashboard for errors
3. Run `npx wrangler pages deployment tail` for real-time logs
4. Check `.cloudflare/config.json` for environment settings

## Best Practices

1. **Always test locally** before deploying
2. **Use feature branches** for new development
3. **Create pull requests** for code review
4. **Monitor deployment status** in GitHub Actions
5. **Verify preview deployments** before merging
6. **Document environment variables** needed for each environment

## Quick Reference

```bash
# Deploy current branch
./deploy-branch.sh

# Deploy with cache purge
./deploy-and-purge.sh --env production --purge

# Check deployment status
npx wrangler pages deployment list --project-name=finanza-react-app

# View live logs
npx wrangler pages deployment tail --project-name=finanza-react-app
```

---

For more information:
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Project README](../README.md)