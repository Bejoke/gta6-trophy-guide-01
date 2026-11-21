# Leonida Trophy Guide

An offline guide and tracker for the 55 PlayStation 5 trophies of Grand Theft Auto VI — with a roadmap to the platinum, missable flags, filters, a spoiler setting, and export/import of progress.

## What it does

- **Checklist tracker** — all 55 official trophies with their official name, description and grade, each with a guide in our own words and a named source. Tick trophies off; progress is saved in the browser (localStorage) and shown as a total, a percentage and a per-grade count.
- **Roadmap to platinum** — six stages in the order to earn them, each with its own trophies and progress. Missable trophies are flagged so you finish them before the final story mission.
- **Filters** — by kind: story, missable, collectibles, activities, online (the official list has no online trophies, so that filter is empty by design). Plus free-text search.
- **Spoiler setting** — hides the names and descriptions of hidden story trophies until you earn them, so a new player can track progress without seeing what happens.
- **Export / import** — download your checked trophies as a JSON file and import it back on any machine.
- **Shareable views** — the URL carries the view: `?view=roadmap`, `?filter=missable`, `?spoiler=on`, `?q=race`, `?select=17`, `?demo=1` (seeds a sample of earned trophies).

## Run it

```sh
node serve.ts
```

Then open http://127.0.0.1:8080/ in a desktop browser. No build step, no network requests — every file the app loads is under `app/`.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with `buildDossier` from `vendor/makefun-frontend.ts`.

## Data

`app/data/trophies.json` holds the 55 trophies: 1 platinum, 2 gold, 6 silver, 46 bronze (28 hidden on PlayStation). Names, descriptions and grades are the official PlayStation list, as listed by Exophase and PSNProfiles. Each trophy also carries its kind, missable flag, roadmap stage, count target where PlayStation tracks one, and a guide with its source.

Sources for the guides: PowerPyx, PSNProfiles, Exophase and TrueTrophies trophy guides. All guide text is written in our own words for this guide; sources are cited, never copied.

## License

MIT. See [LICENSE](LICENSE). Unofficial fan guide — not affiliated with Rockstar Games or PlayStation, and no Rockstar logo, artwork or game screenshot is used.
