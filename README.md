# Conversational Data Analyst

A full-stack application where users ask business questions in natural language and receive answers derived from structured banking data, presented as text, tables, KPI cards, or charts.

## Architecture

```
┌─────────────┐     POST /api/chat     ┌─────────────────┐     ┌──────────┐
│  React UI   │ ──────────────────────> │  Express API    │ ──> │  SQLite  │
│  (Vite)     │ <────────────────────── │  (TypeScript)   │ <── │  (DB)    │
└─────────────┘    JSON response        └─────────────────┘     └──────────┘
                                              │
                                     ┌────────┴────────┐
                                     │   Mock LLM      │
                                     │ (keyword match)  │
                                     └─────────────────┘
```

**Frontend** (`client/`): React + TypeScript + Vite + Recharts
- Chat-style UI with auto-scroll
- Conditional rendering: text, table, chart (bar/line/pie), KPI card
- Copy-to-clipboard for all response types
- Collapsible SQL view for transparency

**Backend** (`server/`): Node.js + Express + TypeScript + better-sqlite3
- `POST /api/chat` — single endpoint for natural language queries
- Mock LLM with keyword matching (~15 patterns)
- SQL validator enforcing read-only queries, table allowlist, single-statement
- Structured JSON responses with display type metadata

**Database**: SQLite with 4 tables:
- `branches` — 5 bank branches
- `customers` — 30 customers across retail/SME/corporate segments
- `onboarding_applications` — 50 applications with various statuses
- `transactions` — 100 transactions of different types

## Setup

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Install dependencies
cd server && npm install
cd ../client && npm install

# Seed the database
cd ../server && npm run db:seed

# Start backend (port 3001)
npm run dev

# In another terminal, start frontend (port 5173)
cd client && npm run dev
```

### Environment Variables

Copy `.env.example` to `.env` in the root:
```
PORT=3001
LLM_PROVIDER=mock
```

### Running Tests

```bash
cd server && npm test
```

## Sample Questions

- "How many customers do we have?"
- "Show monthly onboarding applications by customer segment"
- "Which branches have the highest rejection rate?"
- "Compare retail and SME onboarding volumes"
- "Show the top five customers by transaction value"
- "Show recent transactions"
- "What is the average transaction amount?"

## Assumptions

- The mock LLM uses keyword matching rather than a real language model for zero-config setup
- SQLite is used for portability (no server setup required)
- Chat history is kept client-side only (no persistence)
- No authentication — single-user demo application
- All monetary values are in INR

## Completed Functionality

- Chat-style UI with natural language input
- Multiple display types: text, table, KPI card, bar/line/pie charts
- SQL validation (read-only, table allowlist, injection prevention)
- Copy-to-clipboard for all response types
- Collapsible SQL query viewer
- Graceful error handling for invalid questions
- Welcome screen with example queries
- Responsive design

## Known Limitations

- Mock LLM only responds to ~15 predefined question patterns
- No real NLP — relies on keyword matching
- No conversation context (each question is independent)
- No authentication or multi-user support
- No data export (CSV download)
- Charts don't support multi-series grouped bar charts

## Productionisation

- Replace mock LLM with OpenAI/Anthropic API for true natural language understanding
- Add authentication and role-based access control
- Use PostgreSQL for production-grade database
- Add rate limiting and request logging
- Implement server-side session management for conversation context
- Add CSV/PDF export functionality
- Deploy with Docker (separate containers for frontend/backend)
- Add monitoring, health checks, and structured logging
- Implement caching for repeated queries
- Add comprehensive E2E tests with Playwright

## AI Tools Disclosure

Claude Code (Anthropic) was used as the primary AI development tool. All architectural decisions (monorepo structure, SQLite for portability, mock LLM pattern, SQL validation strategy, component hierarchy) were made by the developer. AI assisted with code generation and implementation speed.
