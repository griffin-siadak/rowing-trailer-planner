# Rowing Trailer Planner — working rules

These rules travel with the repo so they apply on any computer.

## Change management

- **Commit after every discrete, verified change.** Once a self-contained change
  builds (`npm run build`) and is confirmed in the preview, commit it before moving
  on to the next one. Don't batch unrelated changes into one commit.
- "Each change" = each logical task requested (e.g. "add the bow limit"), not every
  individual file edit within it. Keep history readable.
- **Blanket permission to commit** — no need to ask before committing. (Pushing to
  remote and deploying to Pages still wait for an explicit ask.)
- **Push reminders** — commit locally for every change; remind the user to push to
  GitHub roughly every 30 minutes rather than pushing automatically.
- Stage only the relevant source files under `src/`. Leave platform/build scaffolding
  untracked unless explicitly asked: `.claude/`, `android/`, `ios/`, `capacitor.config.ts`.
- End commit messages with the `Co-Authored-By` trailer.
- Deploy to GitHub Pages (`npm run deploy`) only when explicitly asked — not on every commit.

## Project conventions

- React + TypeScript + Vite. `verbatimModuleSyntax` is on: **all type-only imports must
  use `import type`** or the app crashes at runtime.
- Zustand `persist` store (`src/store.ts`). Bump the store `version` and add a `migrate`
  step when changing persisted shape.
- Coordinate system: `xM` = lateral from centreline (0 = centre), `zCenterM` = longitudinal
  from trailer mid (0 = midpoint, +Z = front/bow).
- Boat classes: large = `8+ 4+ 4- 4x`; slingable = `1x 2x 2-`. `Boat.guest` splits
  home vs guest boats.
