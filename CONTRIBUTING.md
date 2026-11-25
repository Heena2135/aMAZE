# Contributing to aMAZE!

Use Node.js 24 and npm. Run `npm ci` at the repository root, then `npm run dev`. Read the [architecture guide](docs/ARCHITECTURE.md) before changing ownership of state or module boundaries. See the [artwork contract](docs/ARTWORK.md) for sprite dimensions and approved Vey artwork.

## Changes and tests

- Keep game rules independent of React and browser APIs. Place browser integration in hooks, reusable views in components, and game flows in screens.
- Use deterministic seeds in tests. For learning changes, test both sparse and sufficient evidence, then confirm Standard mode behaves independently of the profile.
- Add storage regression coverage when changing the saved schema. Validate old saves or provide a migration when changing the version.
- Preserve keyboard and touch controls, the mute setting, and both reduced-motion preferences. Test the affected screens in a browser and document the viewport and device coverage.
- Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`. Keep generated output, local profiles, credentials, and environment files out of Git.
- Reference relevant tests and design tradeoffs in the pull request. Add user-visible changes to the changelog. Include only original or appropriately licensed assets.

Opening a pull request runs the validation workflow. Publishing is a separate, manual process. License selection is pending maintainer approval.
