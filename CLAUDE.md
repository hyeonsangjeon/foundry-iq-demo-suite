# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Foundry IQ Demo Suite — a Next.js 14 application showcasing Azure AI Search Knowledge Retrieval (Agentic Retrieval) and Azure AI Foundry Agent Service. Used for production demos and workshop labs.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build (uses next build)
npx next build       # Same as above, used for quick verification
npm run start        # Start production server
```

No test runner is configured. Verify changes with `npx next build`.

## Architecture

### App Router (`app/`)
- **API Routes** (`app/api/`): Proxy to Azure services. Key namespaces: `knowledge-bases/`, `knowledge-sources/`, `agentsv2/`, `health/`
- **Pages**: `/` (landing), `/playground/[agentId]` (KB playground), `/knowledge/` (KB management), `/agents/` (agent list), `/test/` (direct KB query)

### Key Components
- `kb-playground-view.tsx` — Main playground UI (~1200 lines). Contains chat, sources panel, trace explorer, insight tour, settings. Most feature work happens here.
- `insight-popup.tsx` — Guided tour popup with `INSIGHT_STEPS[]` array and Prev/Next navigation
- `runtime-settings-panel.tsx` — Runtime configuration (reasoning effort, model selection, etc.)
- `landing-page.tsx` — Home page with demo cards
- `trace-explorer/` — Subdirectory with 5 files for retrieval trace visualization

### Lib Layer (`lib/`)
- `api.ts` — API client functions (`fetchKnowledgeBases`, `retrieveFromKnowledgeBase`, etc.). All Azure calls go through Next.js API routes.
- `token-manager.ts` — Azure bearer token management (Service Principal / Managed Identity / manual)
- `motion.ts` — Shared Framer Motion animation variants
- `utils.ts` — `cn()` (clsx + tailwind-merge), date formatting, text cleaning

### Types (`types/`)
- `knowledge-retrieval.ts` — Complete TypeScript definitions for Knowledge Retrieval API v2025-11-01-preview with type guards

## Design System

Token-driven design system defined in `tokens.json`, consumed by `tailwind.config.js`.

**Color convention** — use semantic token classes, not raw colors:
- Backgrounds: `bg-canvas`, `bg-subtle`, `bg-card`, `bg-elevated`
- Foreground: `fg-default`, `fg-muted`, `fg-subtle`, `fg-on-accent`
- Accent: `accent`, `accent-hover`, `accent-subtle`, `accent-muted`
- Stroke: `stroke-divider`, `stroke-strong`
- Glass effects: `glass-surface`, `glass-hover`, `glass-border`

**Fonts**: Space Grotesk (sans), JetBrains Mono (mono) — loaded in `app/layout.tsx`.

**Dark mode**: `darkMode: 'class'` via next-themes. CSS variables switch in `globals.css`.

## Environment

Copy `.env.example` to `.env.local`. Required:
- `FOUNDRY_PROJECT_ENDPOINT` + `FOUNDRY_API_VERSION` — Foundry project
- `AZURE_SEARCH_ENDPOINT` + `AZURE_SEARCH_API_KEY` — AI Search
- `AZURE_TENANT_ID` + `AZURE_CLIENT_ID` + `AZURE_CLIENT_SECRET` — Service Principal auth

## Conventions

- TypeScript with `strict: false`. Path alias `@/*` maps to project root.
- UI primitives in `components/ui/` (Button, Card, Select, etc.) — Radix-based, CVA-styled.
- Shared layout components in `components/shared/` (PageHeader, EmptyState, etc.)
- Animations use Framer Motion. Shared variants in `lib/motion.ts`.
- Icons from `@fluentui/react-icons` (primary) and `lucide-react` (supplementary).
- Agent definitions live in `.github/agents/` (frontend-developer, ui-designer, ux-researcher, copilot-instructions).
- Task tracking in `tasks/` directory with subdirs `dev/`, `qa/`, `uiux/`.
