/**
 * Production build: bundle + minify the TypeScript app into a single ES module
 * and emit a content-hash build stamp for service-worker cache busting.
 *
 * Type checking is done separately by `tsc --noEmit` (npm run typecheck), which
 * the `build` script runs first.
 */
import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// The source uses NodeNext-style ".js" extensions in relative imports; map them
// back to their ".ts" sources so esbuild can bundle straight from src/.
const resolveTsJs = {
  name: 'resolve-ts-js',
  setup(b) {
    b.onResolve({ filter: /^\.\.?\// }, (args) => {
      if (!args.importer) return undefined;
      if (!args.path.endsWith('.js')) return undefined;
      const abs = path.resolve(path.dirname(args.importer), args.path);
      const tsPath = abs.replace(/\.js$/, '.ts');
      // Only redirect when the .ts source actually exists; otherwise defer to
      // esbuild's normal resolution (e.g. a genuine .js file or dependency).
      return existsSync(tsPath) ? { path: tsPath } : undefined;
    });
  }
};

await mkdir(path.join(root, 'assets/js'), { recursive: true });

await build({
  entryPoints: [path.join(root, 'src/main.ts')],
  bundle: true,
  minify: true,
  format: 'esm',
  target: ['es2020'],
  outfile: path.join(root, 'assets/js/main.js'),
  legalComments: 'none',
  // Bake the public backend/race-API URLs in from GitHub Actions *Variables*
  // (GAS_API_URL / BACKEND_URL). Absent locally → empty string, so the app
  // falls back to the user-entered settings exactly as before.
  define: {
    __GAS_API_URL__: JSON.stringify(process.env.GAS_API_URL ?? ''),
    __BACKEND_URL__: JSON.stringify(process.env.BACKEND_URL ?? ''),
    __TURNSTILE_SITE_KEY__: JSON.stringify(process.env.TURNSTILE_SITE_KEY ?? '')
  },
  plugins: [resolveTsJs]
});

// Hash the built bundle (+ CSS) so the service worker cache name changes only
// when shipped content changes — no more hand-maintained version strings.
const js = await readFile(path.join(root, 'assets/js/main.js'));
let css = Buffer.alloc(0);
try {
  css = await readFile(path.join(root, 'assets/css/main.css'));
} catch {
  // CSS is optional for hashing purposes.
}
const hash = createHash('sha256').update(js).update(css).digest('hex').slice(0, 10);

// Expose both the human-readable version (from package.json — single source of
// truth) and the content hash. Set on `self` so it works in the service worker
// (importScripts) AND in the page (self === window for a classic script).
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const version = pkg.version || '0.0.0';
await writeFile(
  path.join(root, 'assets/js/build-info.js'),
  `self.__BUILD_HASH__ = '${hash}';\nself.__APP_VERSION__ = '${version}';\n`
);

console.log(
  `Built assets/js/main.js (${(js.length / 1024).toFixed(1)} KB) — v${version}, build hash ${hash}`
);
