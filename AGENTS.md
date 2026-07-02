# Agent Rules

## Commands and Scripts
Instead of manually building, linting, formatting, or checking types, use the following workspace scripts:
* **Typecheck**: `bun run typecheck` (runs `tsgo --noEmit`)
* **Lint**: `bun run lint` (runs `oxlint`)
* **Lint Fix**: `bun run lint:fix` (runs `oxlint --fix`)
* **Format**: `bun run fmt` (runs `oxfmt`)
* **Format Check**: `bun run fmt:check` (runs `oxfmt --check`)

## Developer Guidelines
* You write good code
* Value simplicity, not over-engineering. There's always a better way with less code. DONT OVERENGINEER
* Ask questions, never assume anything
* Always try to reuse existing components if they exist, try not to recreate them if they exist
* Try to write less code to do as much as possible
* Follow YAGNI, DRY, KISS and SOLID Principles
