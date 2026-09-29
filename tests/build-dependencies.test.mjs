import { build } from 'vite';

import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { requireBundledDependencies } from '../scripts/require-bundled-dependencies.ts';

test('production builds reject missing optional SDKs but allow unused connectors', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'mstrx-build-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const connector = path.join(root, 'node_modules/test-connector');
  await mkdir(connector, { recursive: true });
  await writeFile(
    path.join(connector, 'package.json'),
    JSON.stringify({
      name: 'test-connector',
      version: '1.0.0',
      type: 'module',
      exports: './index.js',
      peerDependencies: { 'missing-wallet-sdk': '*' },
      peerDependenciesMeta: { 'missing-wallet-sdk': { optional: true } },
    }),
  );
  await writeFile(
    path.join(connector, 'index.js'),
    "export const connect = () => import('missing-wallet-sdk'); export const injected = () => 'ready';",
  );
  await writeFile(
    path.join(root, 'index.html'),
    '<script type="module" src="/main.js"></script>',
  );
  const options = {
    root,
    configFile: false,
    logLevel: 'silent',
    plugins: [requireBundledDependencies()],
    build: { write: false },
  };

  await writeFile(
    path.join(root, 'main.js'),
    "import { connect } from 'test-connector'; window.connect = connect;",
  );
  await assert.rejects(
    build(options),
    /Missing runtime dependency.*missing-wallet-sdk/,
  );

  await writeFile(
    path.join(root, 'main.js'),
    "import { injected } from 'test-connector'; window.connect = injected;",
  );
  await assert.doesNotReject(build(options));
});
