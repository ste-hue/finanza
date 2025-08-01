# 🎯 ORTI Finance - MCP Supabase Direct

**Ruthlessly simplified financial dashboard with zero complexity.**

## 🏗️ Architecture

```
React Frontend → Supabase Direct → Database
```

**No backend, no FastAPI, no polling, no complexity - just works.**

## 🚀 Quick Start

```bash
# Start dashboard
./orti start

# Check status  
./orti status

# Stop all
./orti stop
```

**Access:** http://localhost:5173

## 📊 Features

- **Real-time sync** via Supabase subscriptions
- **View modes:** Combined, Consolidated, Projections  
- **Variance analysis** between actual vs projected
- **Monthly charts** with visual indicators
- **Category breakdown** with drill-down

## 🔧 What Was Eliminated

**Deleted 80% of codebase:**
- ❌ FastAPI backend (entire orti-finance-api/)
- ❌ Multiple test scripts (test_*.sh, test_*.html)
- ❌ Complex components (ZenFinancialDashboard 1265 lines → SimpleDashboard 400 lines)
- ❌ Multiple hooks (useFinCalSupabase, useFinanceAPI → useSupabaseFinance)
- ❌ Multiple startup scripts (start-orti.sh, stop-orti.sh → orti-start.sh)

**Result:** Single hook, single component, single script.

## 🎨 Tech Stack

- **Frontend:** React + TypeScript + Tailwind
- **Database:** Supabase (direct client)
- **Real-time:** Supabase subscriptions
- **Dev Server:** Vite (port 5173)

## 📁 Structure

```
orti-finance-compass/
  src/
    hooks/
      useSupabaseFinance.ts    # Single unified hook
    components/
      SimpleDashboard.tsx      # Single unified component
    pages/
      Index.tsx                # Entry point
orti                           # Unified command
orti-start.sh                  # Unified launcher
```

## 🔥 How It's Different

**Before (Complex):**
- 15+ scripts, 8+ components, 3+ hooks
- FastAPI backend + real-time polling
- Multiple entry points, complex state management

**After (Simple):**
- 3 files total (hook + component + script)
- Direct Supabase client + subscriptions
- Single entry point, unified state

## 💾 Data Flow

1. **Load:** Single optimized query with JOINs
2. **Process:** Client-side aggregation (faster than SQL)
3. **Display:** Reactive UI with real-time updates
4. **Save:** Direct upsert + automatic refresh

## 🎯 Commands

```bash
./orti           # Show help
./orti start     # Start dashboard  
./orti stop      # Stop processes
./orti status    # Check status
```

**That's it. No complexity, just results.**