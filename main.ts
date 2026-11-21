// Leonida Trophy Guide — hand-in program.
// Copies app/ and screenshots/ from this repository into the output
// directory and writes output/dossier.json with buildDossier from the
// kit's bridge library. Runs on Node 22 with the standard library only;
// nothing is installed before it runs, and both runs must write the
// same bytes, so every step here is deterministic.

import { cp, lstat, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const REPO_ROOT = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR || '/output';

const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 48 * 1024 * 1024,
  app_path_max_bytes: 1000,
};

async function countFiles(dir: string): Promise<number> {
  let total = 0;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) total += await countFiles(path);
    else if (entry.isFile()) total += 1;
  }
  return total;
}

async function main(): Promise<void> {
  const appDir = join(REPO_ROOT, 'app');
  const shotsDir = join(REPO_ROOT, 'screenshots');

  const appStat = await lstat(appDir).catch(() => null);
  if (!appStat || !appStat.isDirectory()) throw new Error('main: no app/ directory in the repository');
  const shotsStat = await lstat(shotsDir).catch(() => null);
  if (!shotsStat || !shotsStat.isDirectory()) throw new Error('main: no screenshots/ directory in the repository');
  const shotCount = await countFiles(shotsDir);
  if (shotCount === 0) throw new Error('main: screenshots/ is empty — hand in 3 or 4 screenshots of the running guide');

  // The gate requires all 55 official trophies, each with a guide: fail
  // loudly here instead of handing in a dossier the scorer refuses.
  const trophyData = JSON.parse(await readFile(join(appDir, 'data', 'trophies.json'), 'utf8')) as {
    trophies?: { name?: unknown; guide?: unknown }[];
  };
  const names = (trophyData.trophies || []).filter(
    (t) => typeof t.name === 'string' && t.name.length > 0 && typeof t.guide === 'string' && t.guide.trim().length > 0,
  );
  if (names.length !== 55) throw new Error(`main: trophies.json names ${names.length} trophies with a guide, expected 55`);

  await rm(OUTPUT_DIR, { recursive: true, force: true });
  await mkdir(OUTPUT_DIR, { recursive: true });
  await cp(appDir, join(OUTPUT_DIR, 'app'), { recursive: true });
  await cp(shotsDir, join(OUTPUT_DIR, 'screenshots'), { recursive: true });

  const dossier = buildDossier(REPO_ROOT, CAPS);
  await writeFile(join(OUTPUT_DIR, 'dossier.json'), dossier);

  const appCount = await countFiles(join(OUTPUT_DIR, 'app'));
  console.log(`hand-in: ${appCount} app files, ${shotCount} screenshot(s), dossier ${dossier.length} bytes -> ${OUTPUT_DIR}`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
