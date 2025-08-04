# ORTI Finance Dashboard

**Gestionale finanziario aziendale** con dashboard interattiva, importazione Excel e analisi in tempo reale.

## 🚀 Live App

- **Production**: https://finanza-63f.pages.dev
- **Custom Domain**: https://finanzaorti.com

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI/UX**: shadcn-ui, Tailwind CSS, Lucide Icons
- **Backend**: Supabase (Database + Auth)
- **Authentication**: Google OAuth + Supabase Auth
- **Deployment**: Cloudflare Pages
- **Development**: Wrangler Pages

## 🏗️ Development Setup

### Prerequisites
- Node.js & npm ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Git

### Local Development

```bash
# Clone the repository
git clone https://github.com/ste-hue/finanza.git
cd finanza/orti-finance-compass

# Install dependencies
npm install

# Start development server (fast, for active development)
npm run dev
# Opens: http://localhost:5173
```

## 🌩️ Cloudflare Pages Development

### Setup Wrangler (one-time)
```bash
# Login to Cloudflare (opens browser)
npx wrangler login

# Verify authentication
npx wrangler whoami
```

### Development Workflows

**1. Fast Development (Vite)**
```bash
npm run dev
# ✅ Hot reload, fast builds
# ✅ Best for active coding
# 🟡 Different from production environment
```

**2. Production Environment Testing (Wrangler)**
```bash
npm run pages:dev
# ✅ Identical to production environment  
# ✅ Same headers, caching, routing as Cloudflare Pages
# ✅ Test before deploy
# 🟡 Slower than Vite dev
# 🌐 Opens on http://localhost:8080
```

**3. Build & Preview**
```bash
npm run build      # Build for production
npm run preview    # Preview built app locally
```

## 🚢 Deployment

### Automatic Deployment (Recommended)
```bash
# Make changes, commit and push
git add .
git commit -m "your changes"
git push origin master

# ✅ Automatically deploys to https://finanza-63f.pages.dev
# ✅ GitHub integration configured
# ✅ Production branch: master
```

### Manual Deployment
```bash
npm run deploy:cloudflare
# Builds and deploys directly via Wrangler
```

## 📊 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite development server (port 5173) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run pages:dev` | Wrangler Pages development server |
| `npm run deploy:cloudflare` | Manual deploy via Wrangler |
| `npm run lint` | Run ESLint |

## 🔧 Configuration Files

### Wrangler Configuration (`wrangler.toml`)
- **Project**: `finanza`
- **Build output**: `dist/`
- **Compatibility date**: `2025-08-04`

### Cloudflare Pages Configuration
- **Headers** (`public/_headers`): Security headers and cache control
- **Redirects** (`public/_redirects`): SPA routing for React Router

### Build Configuration
- **Framework**: Vite + React
- **Build command**: `npm run build`
- **Output directory**: `dist`
- **Root directory**: `orti-finance-compass`

## 🔐 Environment Variables

Production environment variables are configured in Cloudflare Pages dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

For local development, create `.env.local`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🚨 Troubleshooting

### OAuth Redirect Errors
If you get `500` errors after Google OAuth, ensure these URLs are configured in Supabase Auth settings:
- `https://finanza-63f.pages.dev`
- `https://finanzaorti.com`
- `http://localhost:5173` (for local development)

### Build Errors
```bash
# Clear build cache
rm -rf dist .vite node_modules/.vite
npm run build
```

### Wrangler Issues
```bash
# Re-authenticate
npx wrangler logout
npx wrangler login

# Check configuration
npx wrangler pages project list
```

## 📁 Project Structure

```
orti-finance-compass/
├── src/
│   ├── components/         # React components
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilities & services
│   ├── pages/             # Route components
│   ├── types/             # TypeScript types
│   └── utils/             # Helper functions
├── public/                # Static assets
├── dist/                  # Built app (auto-generated)
├── wrangler.toml         # Cloudflare Pages config
└── package.json          # Dependencies & scripts
```

## 🎯 Workflow Summary

**For Development**:
1. `cd orti-finance-compass`
2. `npm run dev` (fast development)
3. `npm run pages:dev` (test production environment)

**For Deployment**:
1. Commit changes to `master` branch
2. Push to GitHub
3. ✅ Auto-deploys to production

**Production URLs**:
- **Main**: https://finanza-63f.pages.dev
- **Custom**: https://finanzaorti.com

---

## 💡 Development Tips

- Use `npm run dev` for active development (fastest)
- Use `npm run pages:dev` before pushing to test production environment
- All pushes to `master` auto-deploy to production
- Check Cloudflare Pages dashboard for deployment status