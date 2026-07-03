# Agent Rules

## Commands and Scripts

Instead of manually building, linting, formatting, or checking types, use the following workspace scripts:

- **Typecheck (Agent)**: `cd packages/agent && bun run typecheck` (runs `tsgo --noEmit`)
- **Typecheck (Web)**: `cd packages/web && bun run typecheck` (runs `tsc --noEmit`)
- **Dev Server (Web)**: `cd packages/web && bun run dev` (starts the Vite dev server)
- **Lint**: `bun run lint` (runs `oxlint` from root)
- **Lint Fix**: `bun run lint:fix` (runs `oxlint --fix` from root)
- **Format**: `bun run fmt` (runs `oxfmt` from root)
- **Format Check**: `bun run fmt:check` (runs `oxfmt --check` from root)

## Developer Guidelines

- You write good code
- Value simplicity, not over-engineering. There's always a better way with less code. DONT OVERENGINEER
- Ask questions, never assume anything
- Always try to reuse existing components if they exist, try not to recreate them if they exist
- Try to write less code to do as much as possible
- Follow YAGNI, DRY, KISS and SOLID Principles
