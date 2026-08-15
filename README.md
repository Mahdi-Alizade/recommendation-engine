# Content-Based Recommendation Engine

A production-ready full-stack recommendation system built with:
- **Backend:** NestJS + Prisma + SQLite (pluggable to PostgreSQL)
- **Frontend:** Next.js 14 (App Router) + TailwindCSS
- **Algorithm:** TF-IDF Vectorization + Cosine Similarity

## Quick Start
```bash
npm install
npm run dev:all

ecurity
All secrets live in .env files excluded by .gitignore
CORS restricted to localhost during development
Rate limiting enabled on public endpoints
Architecture
See /docs/architecture.png (TBD) | Monorepo with npm workspaces.