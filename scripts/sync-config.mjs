// Rewrites the generated block of src/config/index.ts from a deployment file.
//   npm run sync:config -- ../MSTRX/deployments/robinhood.json [--check]
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const CONFIG_FILE = 'src/config/index.ts';

// Syncing from another deployment would silently repoint a production build.
export const DEPLOYMENT = 'robinhood';

const START = '// ── generated from the deployment file';
const END = '// ── end generated';

const FIELDS = [
  ['BTC', 'btc'],
  ['STRAT', 'strat'],
  ['VVEST', 'vvest'],
  null,
  ['TREASURY', 'treasury'],
  ['STAKING', 'staking'],
  ['VESTING', 'vestingVault'],
  ['BONDING', 'bonding'],
  ['REDEMPTION', 'redemption'],
  ['PREMIUM_SALES', 'premiumSales'],
  ['FEE_VAULT', 'feeVault'],
  ['PROTOCOL_READER', 'protocolReader'],
  null,
  ['AUTHORITY', 'authority'],
  ['PARAMS_TIMELOCK', 'paramsTimelock'],
  ['UPGRADE_TIMELOCK', 'upgradeTimelock'],
  ['PARAMS_GOVERNOR', 'paramsGovernor'],
  ['UPGRADE_GOVERNOR', 'upgradeGovernor'],
  null,
  ['PROTOCOL_ORACLE', 'protocolOracle'],
  ['STRAT_BTC_ADAPTER', 'stratBtcAdapter'],
  ['POOL_HOOK', 'poolHook'],
  ['POOL_MANAGER', 'poolManager'],
];

export function generatedBlock(deployment) {
  const a = deployment.addresses ?? {};
  const need = (key) => {
    const value = a[key];
    if (!value) throw new Error(`the deployment file has no addresses.${key}`);
    return value.toLowerCase();
  };

  return [
    `${START}: npm run sync:config ────────────────────────────────`,
    'export const ADDRESSES = {',
    ...FIELDS.map((f) => (f === null ? '' : `  ${f[0]}: '${need(f[1])}',`)),
    '} as const satisfies Record<string, `0x${string}`>;',
    '',
    "/// The one pool: STRAT priced in cbBTC, with the protocol's own hook attached.",
    'export const STRAT_BTC_POOL_ID =',
    `  '${need('stratBtcPoolId')}' as const;`,
    '',
    '/// Where log queries start, instead of at genesis.',
    `export const DEPLOY_BLOCK = ${deployment.startBlock}n;`,
    `${END} ──────────────────────────────────────────────────────────────────────────`,
  ].join('\n');
}

export function spliceConfig(source, block) {
  const start = source.indexOf(START);
  const end = source.indexOf(END);
  if (start < 0 || end < 0) {
    throw new Error('the config has no generated markers to replace between');
  }
  const endOfEnd = source.indexOf('\n', end);
  return source.slice(0, start) + block + source.slice(endOfEnd);
}

// Also imported by the drift test.
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const file = process.argv[2];
  const check = process.argv.includes('--check');
  if (!file) {
    console.error('usage: npm run sync:config -- <deployment.json> [--check]');
    process.exit(1);
  }
  if (!fs.existsSync(file)) {
    console.error(`no deployment file at ${path.resolve(file)}`);
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (deployment.deployment !== DEPLOYMENT) {
    console.error(
      `${file} is deployment "${deployment.deployment}", and this app is built for ` +
        `"${DEPLOYMENT}". Syncing from it would repoint the production build.`,
    );
    process.exit(1);
  }

  const before = fs.readFileSync(CONFIG_FILE, 'utf8');
  const after = spliceConfig(before, generatedBlock(deployment));

  if (before === after) {
    console.log(`${CONFIG_FILE} already matches ${file}`);
    process.exit(0);
  }
  if (check) {
    console.error(`${CONFIG_FILE} has drifted from ${file}. Run:`);
    console.error(`  npm run sync:config -- ${file}`);
    process.exit(1);
  }
  fs.writeFileSync(CONFIG_FILE, after);
  console.log(`${CONFIG_FILE} rewritten from ${file}`);
}
