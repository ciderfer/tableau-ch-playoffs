# AGENTS.md

## Project Direction

- Keep this project as a static HTML/CSS/JS app unless the user explicitly asks for a framework migration.
- Use Netlify Functions for server-side NHL/API work.
- Preserve GitHub to Netlify deployment.
- Keep changes scoped and avoid unrelated refactors.

## Verification

Run these checks before committing JavaScript changes:

```bash
node --check app.js
node --check netlify/functions/nhl.js
```

For UI-heavy changes, inspect the site in a browser and verify desktop and mobile layouts.

## Data Rules

- NHL API data should flow through `netlify/functions/nhl.js` where possible.
- NHL.com projected lineups are editorial projections, not team-confirmed lineups.
- Do not label social or editorial lineup data as confirmed unless the source clearly confirms it.
- If confirmed lineups are added, include source URL and timestamp.

## Content Rules

- Keep French UI copy concise.
- Avoid duplicating the same data in multiple places.
- Keep the live score card as the primary match-state surface.
- Notes are local/private by design; do not make them shared without auth/moderation.

## Git

- Do not revert user changes unless explicitly requested.
- Keep commits focused.
- Push to `main` only when changes are validated and ready to deploy.

