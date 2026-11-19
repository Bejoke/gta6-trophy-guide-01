// Leonida Trophy Guide — hand-in program (Node 22, standard library only).
// The guide itself is plain static files under app/ (index.html, app.js,
// style.css and data/trophies.json), served as-is by any static server with
// app/ at its root, and it fetches nothing at run time. This program is the
// entry point the grader runs: it gathers app/ and screenshots/ from beside
// this file into the output directory and writes dossier.json there, using
// the vendored make.fun library. vendor/makefun-frontend.ts is the kit's
// copy and must stay untouched, so the dossier the scorer rebuilds matches
// this one byte for byte.
//
// Run it outside the grader like this:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Inside the grader MAKEFUN_OUTPUT_DIR is unset and /output is used.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Copy the whole guide, then the screenshots (the first by name is the
// cover), into the output directory.
mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// Build the dossier the judge reads: the screenshots, the first load's
// files and bytes, and the guide's source. The caps mirror the scorer's
// gate (at most 4 screenshots, each at most 256 KiB; app/ at most 993
// files and directories and 48 MiB), so a dossier written here is one
// the scorer accepts.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
