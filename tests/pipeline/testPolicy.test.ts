import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

// The test pipeline's own tests.
// -----------------------------------------------------------------------
// WHAT WENT WRONG. `@acos/db` has no test files, so `vitest run` exited 1
// with "No test files found", so `turbo run test` aborted, so FOURTEEN
// packages never executed — and the run reported "4 successful, 18 total"
// rather than anything that looked like a test failure. One package with
// nothing to test took down the evidence for every package that had
// something to prove.
//
// WHY NOT --passWithNoTests EVERYWHERE. That is the one-word fix and it
// is the wrong one. Applied globally it means a package whose tests are
// deleted, whose test glob is broken by a config change, or whose suite
// is accidentally excluded by a rename, reports success. The failure mode
// it introduces is silent, permanent, and indistinguishable from health —
// which is strictly worse than the loud failure it removes.
//
// WHAT WE DO INSTEAD. Exemptions are explicit, per package, and carry a
// stated reason in the package's own `test` script. This file is what
// stops that list from rotting: an exemption is only honest while the
// package really has no testable logic, and a package that grows some
// must lose its exemption. Nobody will remember that. This remembers it.
// -----------------------------------------------------------------------

const REPO = resolve(__dirname, '../..');

/**
 * Packages allowed to have no test files, and why.
 *
 * Adding an entry here is a deliberate, reviewable act. Every entry is
 * checked below against what the package actually contains, so an
 * exemption that stops being true fails this suite.
 */
const NO_TEST_EXEMPTIONS: Record<string, string> = {
  '@acos/db': 'a Prisma client singleton and a type re-export',
  '@acos/shared-types': 'type declarations only, no runtime logic',
};

/**
 * Source files an exempt package may contain. Anything beyond these is
 * logic, and logic gets tests.
 */
const EXEMPT_ALLOWED_FILES: Record<string, readonly string[]> = {
  '@acos/db': ['index.ts', 'client.ts'],
  '@acos/shared-types': ['index.ts'],
};

interface Pkg {
  name: string;
  dir: string;
  scripts: Record<string, string>;
  testFiles: string[];
  sourceFiles: string[];
}

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry === '.next') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function loadPackages(): Pkg[] {
  const pkgs: Pkg[] = [];
  for (const group of ['packages', 'apps']) {
    const base = join(REPO, group);
    if (!existsSync(base)) continue;
    for (const entry of readdirSync(base)) {
      const dir = join(base, entry);
      const manifest = join(dir, 'package.json');
      if (!existsSync(manifest)) continue;
      const json = JSON.parse(readFileSync(manifest, 'utf8')) as {
        name: string;
        scripts?: Record<string, string>;
      };
      const files = [...walk(join(dir, 'src')), ...walk(join(dir, 'app'))];
      pkgs.push({
        name: json.name,
        dir,
        scripts: json.scripts ?? {},
        testFiles: files.filter((f) => /\.test\.tsx?$/.test(f)),
        sourceFiles: files.filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f)),
      });
    }
  }
  return pkgs;
}

const PACKAGES = loadPackages();

describe('every package participates in the pipeline', () => {
  it('finds the workspace', () => {
    // A bug in the loader above would make every test below vacuously
    // pass, so assert the loader found something first.
    expect(PACKAGES.length).toBeGreaterThan(10);
  });

  it('every package declares a test script', () => {
    const missing = PACKAGES.filter((p) => !p.scripts.test).map((p) => p.name);
    expect(missing).toEqual([]);
  });

  it('every package declares a test:integration script, so turbo reaches it', () => {
    const missing = PACKAGES.filter((p) => !p.scripts['test:integration']).map((p) => p.name);
    expect(missing).toEqual([]);
  });
});

describe('packages that should have tests, do', () => {
  it('no package outside the exemption list is without tests', () => {
    const untested = PACKAGES.filter(
      (p) => p.testFiles.length === 0 && !(p.name in NO_TEST_EXEMPTIONS),
    ).map((p) => p.name);

    // If this fails, the fix is to write tests — NOT to add the package
    // to NO_TEST_EXEMPTIONS.
    expect(untested).toEqual([]);
  });

  it('a package with tests actually runs vitest', () => {
    const wrong = PACKAGES.filter(
      (p) => p.testFiles.length > 0 && !(p.scripts.test ?? '').includes('vitest'),
    ).map((p) => `${p.name}: ${p.scripts.test}`);
    expect(wrong).toEqual([]);
  });
});

describe('the exemptions are still true', () => {
  it.each(Object.keys(NO_TEST_EXEMPTIONS))('%s still has no testable logic', (name) => {
    const pkg = PACKAGES.find((p) => p.name === name);
    expect(pkg, `${name} is exempt but does not exist`).toBeDefined();

    const allowed = EXEMPT_ALLOWED_FILES[name] ?? [];
    const unexpected = pkg!.sourceFiles
      .map((f) => f.slice(pkg!.dir.length + 1))
      .filter((f) => !allowed.some((a) => f === `src/${a}`));

    // The whole point: the day somebody adds a repository function to
    // @acos/db, this fails and the exemption has to be reconsidered
    // rather than silently covering new logic.
    expect(unexpected, `${name} grew source files beyond its exemption`).toEqual([]);
  });

  it('an exempt package says why in its test script, and exits 0', () => {
    for (const name of Object.keys(NO_TEST_EXEMPTIONS)) {
      const pkg = PACKAGES.find((p) => p.name === name)!;
      const script = pkg.scripts.test ?? '';
      expect(script, name).toContain('exit 0');
      // The reason lives in the script itself, so it appears in the CI
      // log next to the package that skipped — not only in this file,
      // where nobody reading the build output would find it.
      const spoken = script.replace(/&&\s*exit 0/, '').replace(/^echo\s*/, '');
      expect(spoken.length, `${name} skips without saying why`).toBeGreaterThan(30);
      expect(spoken.toLowerCase(), name).toMatch(/no .*(logic|tests|runtime)/);
    }
  });

  it('exemptions are not achieved with --passWithNoTests', () => {
    // --passWithNoTests turns "the suite vanished" into "the suite
    // passed". An exemption must be visible as an exemption.
    const sneaky = PACKAGES.filter((p) => (p.scripts.test ?? '').includes('--passWithNoTests')).map(
      (p) => p.name,
    );
    expect(sneaky).toEqual([]);
  });
});

describe('the migration chain is deployable', () => {
  const MIGRATIONS = join(REPO, 'packages/db/prisma/migrations');

  it('every migration directory holds a migration.sql', () => {
    const bad = readdirSync(MIGRATIONS)
      .filter((d) => statSync(join(MIGRATIONS, d)).isDirectory())
      .filter((d) => !existsSync(join(MIGRATIONS, d, 'migration.sql')));
    expect(bad).toEqual([]);
  });

  it('no migration references a table no migration creates', () => {
    // The defect that broke `prisma migrate deploy`: 0005 and 0006
    // ALTERed acq_* tables and used enum types that nothing in the chain
    // had ever created, so deploy died at 0005 with 42704 on a clean
    // database — which is every database, since it had never succeeded.
    const dirs = readdirSync(MIGRATIONS)
      .filter((d) => statSync(join(MIGRATIONS, d)).isDirectory())
      .sort();

    const created = new Set<string>();
    const offences: string[] = [];

    for (const dir of dirs) {
      const sql = readFileSync(join(MIGRATIONS, dir, 'migration.sql'), 'utf8');
      for (const m of sql.matchAll(/CREATE TABLE(?:\s+IF NOT EXISTS)?\s+"?([a-z_]+)"?/gi)) {
        created.add(m[1]!.toLowerCase());
      }
      for (const m of sql.matchAll(/ALTER TABLE(?:\s+IF EXISTS)?\s+"?([a-z_]+)"?/gi)) {
        const table = m[1]!.toLowerCase();
        if (!created.has(table)) offences.push(`${dir}: ALTER TABLE ${table}`);
      }
    }

    expect(offences).toEqual([]);
  });
});

describe('each vitest config collects only its own directory', () => {
  // This bug landed twice. An `include` of '**/*.test.ts' is resolved
  // from the tests/ PACKAGE root, not from the config file's directory,
  // so the fixtures config collected the whole integration suite and
  // `pnpm test` quietly ran tests that need a database — passing or
  // failing depending on whether one happened to be running.
  const CONFIGS = ['fixtures', 'integration', 'contract', 'pipeline'];

  it.each(CONFIGS)('%s/vitest.config.ts is scoped to its directory', (dir) => {
    const cfg = readFileSync(join(REPO, 'tests', dir, 'vitest.config.ts'), 'utf8');
    const include = /include:\s*\[([^\]]*)\]/.exec(cfg)?.[1] ?? '';
    expect(include, `${dir} has no include`).not.toBe('');
    // Every glob must name its own directory, so it cannot reach a sibling.
    const globs = [...include.matchAll(/'([^']+)'/g)].map((m) => m[1]!);
    expect(globs.length).toBeGreaterThan(0);
    for (const glob of globs) {
      expect(glob, `${dir} collects outside itself: ${glob}`).toMatch(new RegExp(`^${dir}/`));
    }
  });
});

describe('the integration suite targets real PostgreSQL', () => {
  it('no integration test substitutes an in-memory fake for the database', () => {
    const files = walk(join(REPO, 'tests/integration')).filter((f) => f.endsWith('.test.ts'));
    expect(files.length).toBeGreaterThan(10);

    const fakes = files.filter((f) => {
      const src = readFileSync(f, 'utf8');
      return /from '.*fakeDb'|new FakeDb|createFakePool/.test(src);
    });
    expect(fakes).toEqual([]);
  });

  it('the integration harness points at a real server, not a default localhost guess', () => {
    const harness = readFileSync(join(REPO, 'tests/integration/support/pgIndexHarness.ts'), 'utf8');
    expect(harness).toContain('TEST_ADMIN_DATABASE_URL');
    // Connecting to a real server is what `serverReachable` proves, and
    // every suite gates on it rather than silently passing without one.
    expect(harness).toContain('serverReachable');
  });

  it('no integration suite skips migrations any more', () => {
    // These workarounds existed only because 0005/0006 could not apply.
    // With the chain deployable they are not merely unnecessary, they
    // would hide a regression in the very migrations they skipped.
    const hits = execSync(
      'grep -rln "skipMigrations" tests/integration --include="*.test.ts" || true',
      { cwd: REPO, encoding: 'utf8' },
    )
      .split('\n')
      .filter((l) => l.trim().length > 0);
    expect(hits).toEqual([]);
  });
});
