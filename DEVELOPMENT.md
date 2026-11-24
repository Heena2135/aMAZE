# Development tracker

## Baseline

The application previously had a fixed 5×5 maze, defensive snapshots, player counters, a ready/playing/won engine, and a playable Canvas prototype. This workspace has no Git metadata. All implementation work was inside `maze-that-learns`.

## Completed phases

| Phase | Implementation | Validation |
| --- | --- | --- |
| 1–6 | Audited the existing engine, controls, and rendering. Added pause/resume and regression tests. | Engine tests and Chrome keyboard, touch, and state transitions. |
| 7 | Added seeded iterative DFS and validated rectangular input to Maze. | Reproducibility and connectivity across seeds and dimensions, including 101×99. |
| 8 | Added BFS, route recovery, topology metrics, and optional one-cell hints. | Shortest route on a loopy fixture, unreachable exit handling, and hint lifecycle. |
| 9 | Added validated movement/lifecycle events, session aggregation, revisits, recovery timing, and bounded event retention. | Direct fixtures test event validation, retention, pause timing, and metrics. |
| 10 | Added first-order relative-turn counts, smoothing, fallback, abstention, and prediction evaluation before updating. | Smoothing, legality masking, cold start, and an out-of-sample decision fixture. |
| 11 | Added transparent heuristic scoring of nine BFS-verified candidates, standard mode, and bounded difficulty adjustments. | Deterministic selection and proof that trained preferences can change selection for a fixed seed. |
| 12 | Added versioned LocalStorage profiles, validation, history/size limits, export, settings, and differentiated resets. | Unit corruption/quota fixtures and browser reload and reset checks. |
| 13 | Added Vey's original CSS artwork, context-driven dialogue, cooldown, animation, sound, mute, and reduced motion. | Chrome checked dialogue transitions during play. Sound is synthesized by Web Audio. |
| 14 | Added First Contact, Observation, Adaptation, Outsmart, and Amaze. Replay and endless layouts use the same generation pipeline. | Progression tests and complete five-stage browser runs. |
| 15 | Added the opening scene, briefing, pause overlay, completion/final summary, progression, report, and settings. | Chrome desktop and 390px mobile emulation with touch and a 3× canvas. |
| 16 | Added Vitest, four test files, and deterministic fixtures. Reviewed bounds, untrusted storage, rendering paths, and listener lifetimes. | TypeScript, ESLint, 14 Vitest tests, production build, and headless Chrome passed. |
| 17 | Added technical README, AGENTS, development and learning documentation, CI, and a manually triggered Pages workflow. | Chrome passed the campaign from the production build served at a local `/amaze/` subpath. Public hosting and remote CI require a repository and authorization. |

## Architectural decisions

- A Maze owns a defensive grid. Player handles walkability and counts, GameEngine owns lifecycle, and Experiment composes them with analytics and dialogue. The browser supplies the clock and receives snapshots.
- A generated layout stays fixed for the experiment. Restart discards incomplete attempt data. Only the first clear of the same active layout receives profile credit. Separate freshly generated replays can contribute observations.
- A ring buffer retains up to 256 raw events for the active session. Counters reflect the full completed session. LocalStorage retains lifetime aggregates, up to 24 completed experiments, a versioned model, and settings, with a 65,536-character serialized limit.
- Junction prediction uses legal relative turns, five conditional samples to use a row, eight legal observations for a prediction, and a minimum 0.12 probability lead. Historical accuracy describes evaluated predictions and is shown after five.
- Standard mode does not use the profile for layouts. Both modes can contribute observations. Adaptive layout selection starts at Adaptation.
- Progression requires clearing the current stage and sufficient observed junctions, 75% route efficiency, or a second clear in a fresh layout. Replays of earlier stages cannot skip locks.
- Gameplay ships no backend or external runtime service. Preparing deployment does not publish the project.

## Performance

Local Node measurements after 15 warm-up runs. For 100 complete selections at 15×15, scoring nine layouts took about 1.08 ms median and 1.48 ms p95. For 50 single 101×101 generation/BFS/topology runs, it took about 3.87 ms median and 4.65 ms p95. These are local algorithm measurements, not device or frame-rate benchmarks. The final production build reports about 80.3 kB gzipped JavaScript and 2.6 kB gzipped CSS.

## Limitations and pending external checks

- Mobile coverage uses Chrome touch and high-DPI emulation. Physical devices, Safari, and a full nonvisual route interface remain unverified.
- At low sample counts, geometric scoring may drive the entire adaptation. Confidence is a model score and does not establish statistical reliability or a behavioral cause.
- Progress is per browser origin. Active sessions do not survive reload, and simultaneous tabs do not merge progress.
- The Pages workflow assumes this Vite application is the repository root. The local production subpath was verified. The hosted workflow remains unrun.

## Change inventory

- **Engine and types:** updated `Maze.ts`, `GameEngine.ts`, and `GameStatus.ts`. Added `Experiment.ts` and `LevelManager.ts`.
- **Generation and analysis:** added `MazeGenerator.ts`, `PathFinder.ts`, `MazeAnalyzer.ts`, `EventTracker.ts`, `SessionAnalyzer.ts`, `MetricsCalculator.ts`, and `PlayerProfile.ts`.
- **Learning and persistence:** added `MarkovModel.ts`, `DifficultyController.ts`, `AdaptiveMazeGenerator.ts`, and `ProfileStorage.ts`.
- **Presentation:** updated `App.tsx`, `App.css`, `useGameEngine.ts`, `MazeCanvas.tsx`, `GameControls.tsx`, `GameHeader.tsx`, and `AlienCompanion.tsx`. Added `GameSettings.tsx`, `ResearchReport.tsx`, `DialogueEngine.ts`, `DialogueLibrary.ts`, and `formatTime.ts`.
- **Verification and project setup:** added `GameEngine.test.ts`, `Experiment.test.ts`, `MazeGenerator.test.ts`, `Learning.test.ts`, `.github/workflows/ci.yml`, and `.github/workflows/pages.yml`. Updated `package.json`, `package-lock.json`, and `vite.config.ts`.
- **Documentation:** added `AGENTS.md`, `DEVELOPMENT.md`, and `LEARNING.md`. Replaced the Vite starter README with project instructions and technical documentation.

A clean offline `npm ci` in a temporary workspace reproduced all 14 tests, type checking, linting, and the production build. The two workflow YAML files parsed locally.
