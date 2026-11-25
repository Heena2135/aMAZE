# aMAZE! artwork and audio

The redesign uses original pixel art. Files are imported through `src/assets/registry.ts`, so Vite resolves their URLs for root and GitHub Pages subpath builds. The art is the current production set and can be replaced without changing game rules or profile storage.

| Artwork | Source | Replacement contract |
| --- | --- | --- |
| Observation deck | `src/assets/backgrounds/observation.png` | 400 × 240 RGB. Keep the left side legible behind the title and the planet toward the right for mobile cropping. |
| Sickbay | `src/assets/backgrounds/sickbay.png` | 400 × 240 RGB. Keep the right side relatively clear for Vey; the dialogue overlays the bottom edge. |
| Astronaut | `src/assets/sprites/astronaut.png` | 96 × 96 transparent sheet. Use four rows (down, right, left, up) and four 24 × 24 frames per row (idle followed by three gait frames). Keep each pose anchored near the same foot position. |
| Human portrait | `src/assets/characters/human.png` | 24 × 24 transparent image. |
| Vey originals | `src/assets/characters/vey-{curious,thinking,excited,concerned,celebrating}.svg` | Five approved transparent SVGs with a 100 × 100 viewBox. These define the exact body, limb, signal and sparkle geometry transcribed into `src/components/Vey.tsx`. |

Tile art is drawn on a native 24-pixel grid in `src/assets/tiles/chamber.ts`. Changes belong there: keep each stage’s floor distinguishable from walls and reserve gold for strong guidance such as the exit. The astronaut, airlock, and hint are composited by `MazeCanvas.tsx` and scaled with nearest-neighbor sampling to the display's pixel density. Scene typography uses system monospace and CSS; no external font downloads are required.

Original sounds are synthesized through Web Audio. Change `src/assets/audio/cues.ts` to alter frequencies, timing, or envelopes. Patterns represent selection, footsteps, wall contacts, transmissions, airlock movement, and completion. Audio only plays after an interaction and respects the mute setting.
