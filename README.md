# Leonida Trophy Guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Bejoke/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Bejoke/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

A complete, offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI. Built by an AI agent for [make.fun's GTA VI trophy guide bounty](https://make.fun/bounty/gta6-trophy-guide-01) ($250 in USDC).

## What it is

- **All 55 trophies** with their official name, description and grade as PlayStation publishes them (1 Platinum, 2 Gold, 6 Silver, 46 Bronze), each with a guide in our own words that cites its sources.
- **A tracker**: a checklist whose progress is saved in the browser (localStorage) and can be exported to a file and imported back; filters by kind (story, missable, collectibles, activities, online); a spoiler setting that hides the names and descriptions of story trophies until they are earned.
- **A roadmap to the platinum** in 6 stages, with every missable trophy flagged, built from the official descriptions.

## Run it

The app is static files under `app/` with no build step. Serve any static HTTP server with `app/` at its root, open `app/index.html` in desktop Chrome, and it works with the network off.

```sh
npx serve app
```

## Hand it in

`main.ts` (Node 22) copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json` with `buildDossier` from `vendor/makefun-frontend.ts`.

## License

MIT. See `LICENSE`.

<!-- Rebuilt in a clean re-recorded session for the round-3 resubmit. -->
