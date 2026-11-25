# aMAZE! architecture

## Directory map

```text
.github/workflows/    validation and manual GitHub Pages publishing
docs/                 architecture, artwork contracts, and screenshots
src/
  algorithms/        seeded maze generation, topology, and pathfinding
  analytics/         event records, session observations, metrics, and profiles
  assets/            approved vectors, pixel art, audio cues, and tile artwork
  companion/         dialogue catalog and cooldown policy
  components/        shared controls, Vey SVG, dialogue reveal, and Canvas
  engine/            Maze, Player, and GameEngine rules
  game/              Experiment orchestration and level selection
  hooks/             React session state and browser audio lifetime
  intelligence/      Markov model, difficulty, and adaptive selection
  screens/           title, first encounter, chamber, map, journal, and settings
  storage/           profile validation, schema projection, and persistence
  types/             shared game types
  utils/             presentation formatting
  App.tsx            screen routing and state retained between screens
  App.css            screen presentation and interaction states
  index.css          shared palette and base styles
  main.tsx           browser entry point
```

## Dependencies and state

The pure engine owns legal movement, status, and snapshots. It imports shared types and other engine modules. Algorithms work on grid and position data. The learning model operates on relative turns and counts without browser dependencies.

The game layer coordinates these pieces. `Experiment` records actual outcomes, advances the deterministic dialogue selector, and commits an eligible result to the profile once. `LevelManager` calls generation and adaptive scoring before creating a chamber. Given the same seed, stage, mode, and profile, layout selection is deterministic.

React bridges those commands to the browser. `App` handles screen transitions and retains the astronaut's facing and pending briefing response while a player visits the map, journal, or settings. Screens own their local inputs and controls. View code chooses the portrait expression from the dialogue signal. `Vey.tsx` draws the original SVG geometry and receives visual state as props. The dialogue catalog and event policy work without React or SVG.

## Rendering and resources

The Canvas paints a chamber's static tile layer once per mounted layout. Snapshot changes update the foreground, and high-DPI drawing retains nearest-neighbor scaling. Resize observers, preference listeners, and animation frames are scoped to the render effect. The current Canvas still redraws animated frames during gameplay. Further changes should follow browser profiling.

Audio synthesis has no downloaded media. `useGameAudio` owns the AudioContext, user-initiated playback, and cleanup. Dialogue text reveal and keyboard listeners are scoped to the component or screen that uses them.

## Persistence and release

The v1 storage adapter validates size and field types, then projects only supported keys into the app. Unknown fields cannot become additional Markov rows or carry over into a later research export. Fractional timings and confidence remain valid. Saved progress is local to the browser origin, and active attempts only live in memory.

Vite uses relative paths for the GitHub Pages subpath. CI, externally hosted Pages, and license approval are distinct release concerns. See [contributor instructions](../CONTRIBUTING.md) and the [development tracker](../DEVELOPMENT.md).
