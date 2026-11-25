# aMAZE!

Build a browser-based adaptive maze that learns from gameplay and explains each personalized challenge. The alien scientist and visual assets must be original.

## Architecture and conventions

- Keep game rules in `src/engine`, graph algorithms in `src/algorithms`, and gameplay observations and learning in `src/analytics` and `src/intelligence`.
- Put experiment coordination in `src/game` and keep the core engine free of analytics, dialogue, and UI imports. Put screen flows in `src/screens`.
- Keep React, Canvas, browser input, audio, and persistence at the application boundary. Pass snapshots to components and send commands back to the engine.
- Use TypeScript types, private state, defensive copies, dependency injection where it helps testing, and direct, readable functions. Validate input at storage and configuration boundaries.
- Represent coordinates as `{ x, y }` and index maze cells as `grid[y][x]`. Use `0` for paths and `1` for walls.
- Run TypeScript, ESLint, tests, and a production build after each major phase. Document progress and tradeoffs in DEVELOPMENT.md and teaching examples in LEARNING.md.

## Roadmap

1. Playable foundation with pause and restart.
2. Seeded DFS generation, BFS validation, and topology metrics.
3. Bounded gameplay events, session metrics, and junction prediction.
4. Adaptive candidate selection, local profile storage, and companion dialogue.
5. Five-stage progression, accessible experience, validation, and GitHub Pages readiness.

## Constraints

Use React, Vite, TypeScript, Canvas, CSS, Vitest, and native browser APIs. Keep gameplay local. Collect no personal data and use no backend, LLM, paid service, or third-party AI API. Keep the separate portfolio project untouched. Never publish or deploy publicly without user approval.
