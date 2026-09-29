import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

import {
  CONFIG_FILE,
  DEPLOYMENT,
  generatedBlock,
  spliceConfig,
} from '../scripts/sync-config.mjs';

/** The committed config must match the contracts deployment file. Skipped when that repo is not checked out. */
const DEPLOYMENT_FILE = `../MSTRX/deployments/${DEPLOYMENT}.json`;

test(`${CONFIG_FILE} matches ${DEPLOYMENT_FILE}`, (t) => {
  if (!existsSync(DEPLOYMENT_FILE)) {
    t.skip(
      `no ${DEPLOYMENT_FILE}; the contracts repository is not checked out here`,
    );
    return;
  }

  const config = readFileSync(CONFIG_FILE, 'utf8');
  const deployment = JSON.parse(readFileSync(DEPLOYMENT_FILE, 'utf8'));

  assert.equal(
    config,
    spliceConfig(config, generatedBlock(deployment)),
    `${CONFIG_FILE} has drifted from ${DEPLOYMENT_FILE}. ` +
      `Run: npm run sync:config -- ${DEPLOYMENT_FILE}`,
  );
});
