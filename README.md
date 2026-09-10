# Engineer Lab

A self-hosted, personal AI engineering lab that helps you generate tailored project ideas, spec them, and drive your **opencode** agents to plan and build real projects.

This is a simplified, opinionated take on the Autonomous Project Portfolio OS: the dashboard is thin, opencode is the brain.

## What it does

- **Personal dashboard** — single-user Next.js app with a dark developer UI.
- **Idea generation** — `POST /api/ideas` prompts opencode to return structured JSON ideas. No extra LLM keys needed.
- **SQLite persistence** — profile, ideas, projects stored locally in `data/app.db`.
- **opencode integration** — the app shells out to the opencode CLI (`opencode run`) for idea generation and future build steps.
- **Portfolio tracking** — save ideas, create projects, track milestones, and build an authentic GitHub portfolio without fabricating activity.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Bun (package manager)
- SQLite via `better-sqlite3`
- opencode CLI for agent orchestration

## Getting started

Prerequisites:
- Bun installed
- `opencode` on PATH (already configured on this machine)

Install and run:
```bash
cd engineer-lab
bun install
bun run dev
```

Open http://localhost:3000

The app starts with a simple “Generate Ideas” button that calls opencode and persists results to SQLite.

## Project structure

```
src/
  app/
    api/ideas/route.ts   # opencode idea generation endpoint
    page.tsx             # dashboard UI
  lib/
    db.ts                # SQLite init + migration
    opencode.ts          # spawn opencode run
data/
  app.db                 # local SQLite store (gitignored)
```

## Workflow

1. Open dashboard → **Generate Ideas** (opencode produces JSON)
2. Pick an idea → create project/spec (coming next)
3. Dashboard drives opencode step-by-step per milestone, streams logs, commits to Git
4. Track progress, quality gate, portfolio export

## Notes

- Authenticity first: never fabricate achievements, users, or GitHub activity.
- Security: opencode handles permissions; the dashboard never stores secrets.
- Self-hosted: no Docker, no external services, just `bun run dev`.

## License

MIT
