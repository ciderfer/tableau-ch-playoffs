# Tableau CH - Project Context

## Links

- Production: https://tableau-ch-playoffs.netlify.app
- GitHub: https://github.com/ciderfer/tableau-ch-playoffs
- Netlify admin: https://app.netlify.com/projects/tableau-ch-playoffs

## Current Stack

- Static HTML/CSS/JS
- Netlify Functions
- GitHub to Netlify CI/CD
- Web App Manifest and service worker for installable PWA behavior
- No frontend framework
- No database

## Current Behavior

- The hero shows a live score card.
- NHL data refreshes in the browser every 60 seconds.
- `netlify/functions/nhl.js` aggregates NHL API data and NHL.com projected lineups.
- The app includes a dynamic Portrait section for MTL vs the current opponent.
- The Bracket section follows the Canadiens' playoff path.
- The TV mode turns the scoreboard into a full-screen second-screen view.
- The service worker pre-caches the static shell but bypasses Netlify Functions so live NHL data is not served from cache.
- If the Netlify function is unavailable, `app.js` falls back to embedded static data or direct schedule data where possible.
- The match notes feature uses `localStorage`; notes are private to each browser, searchable, and not shared publicly.

## Data Sources

- NHL schedule: `https://api-web.nhle.com/v1/club-schedule-season/MTL/now`
- NHL standings: `https://api-web.nhle.com/v1/standings/now`
- NHL club stats: `https://api-web.nhle.com/v1/club-stats/{TEAM}/now`
- NHL roster: `https://api-web.nhle.com/v1/roster/{TEAM}/current`
- NHL playoff bracket: `https://api-web.nhle.com/v1/playoff-bracket/{YEAR}`
- NHL special teams stats: `https://api.nhle.com/stats/rest/en/team/powerplay` and `https://api.nhle.com/stats/rest/en/team/penaltykill`
- NHL.com projected lineups: `https://www.nhl.com/news/nhl-lineup-projections-2025-26-season`

## Important Product Decisions

- Keep the app static for now. React/Next.js is not justified unless the app grows into a larger multi-page or authenticated product.
- Netlify is the preferred deployment target because the project already uses Netlify Functions and `netlify.toml`.
- Use official NHL logos from `assets.nhle.com` for team identities.
- Avoid scraping social platforms for confirmed lineups unless a stable API/source is available.
- Treat NHL.com lineups as `Projection NHL.com`, not team-confirmed.
- Use a manual or curated override if team-confirmed lineups become necessary.

## Known Limits

- Projected lineups are editorial and can differ from final team-confirmed lineups.
- Fully automatic social lineup detection is fragile and may require paid APIs or unstable scraping.
- Notes are local only and intentionally not shared across users.
- There is no moderation/auth system for public user-generated content.
- PWA offline mode is only for the static shell; live score, bracket, portrait, leaders, and lineups still depend on network/API availability.
- Visual QA in this repo has mostly been manual plus syntax checks; browser screenshot QA should be added for larger UI changes.

## Suggested Next Tasks

- Add optional confirmed-lineup override data with source URL and timestamp.
- Improve mobile QA with browser screenshots.
- Consider reducing fallback static data once live data is stable.
- Add a custom domain and verify HTTPS/PWA install behavior on that domain.
- Consider a lightweight analytics/monitoring pass once the site is public.

## Operational Notes

- Treat `main` as production-ready only. Use short branches and PR previews for routine changes.
- Check Netlify credits before relying on automatic production deploys.
- Run `node --check app.js` and `node --check netlify/functions/nhl.js` before commits.
- When editing PWA behavior, verify `manifest.json`, `sw.js`, and the icon assets together.
- Keep commits focused and deploy via GitHub to Netlify.
- Avoid adding secrets, tokens, or personal credentials to the repository.
- Do not make notes public without moderation or authentication.
