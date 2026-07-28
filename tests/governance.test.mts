import { encodeFunctionData } from 'viem';

import assert from 'node:assert/strict';
import { before, describe, test } from 'node:test';

import { AUTHORITY_ABI } from '../src/lib/abi/authority.ts';
import {
  MAX_LOG_SPAN,
  logWindows,
  mergeProposals,
  readProposalCache,
  writeProposalCache,
} from '../src/lib/governance-log-cache.ts';
import {
  formatDuration,
  quorumReached,
  secondsUntil,
  tallyOf,
  voteSucceeded,
} from '../src/lib/governance.ts';
import { isAffectedByProtocolWrite } from '../src/lib/invalidate.ts';
import { PROPOSAL_ACTIONS } from '../src/lib/proposal-actions.ts';
import { decodeCall, decodeProposalCalls } from '../src/lib/proposal-decode.ts';
import { formatVotes } from '../src/lib/utils.ts';

const strat = (whole: bigint) => whole * 10n ** 18n;

/** Mirrors `StratGovernor._voteSucceeded` and `GovernorCountingSimple._quorumReached`. */
describe('vote counting follows the contracts', () => {
  test('quorum counts "for" and "abstain" and ignores "against"', () => {
    const quorum = strat(1_000n);

    // 1800 votes cast, but against does not count toward quorum.
    assert.equal(
      quorumReached(
        {
          forVotes: strat(900n),
          againstVotes: strat(900n),
          abstainVotes: 0n,
        },
        quorum,
      ),
      false,
      'against votes must not carry a proposal over quorum',
    );

    assert.equal(
      quorumReached(
        {
          forVotes: strat(900n),
          againstVotes: 0n,
          abstainVotes: strat(900n),
        },
        quorum,
      ),
      true,
      'abstentions count towards quorum',
    );
  });

  test('majority is measured over decisive votes at the track’s own bar', () => {
    const votes = {
      forVotes: strat(60n),
      againstVotes: strat(40n),
      abstainVotes: strat(1_000n),
    };

    assert.equal(voteSucceeded(votes, 5001n), true);
    assert.equal(voteSucceeded(votes, 6667n), false);

    // Abstentions are not decisive.
    assert.equal(
      voteSucceeded({ ...votes, abstainVotes: 0n }, 5001n),
      true,
      'abstentions must not dilute the support ratio',
    );
  });

  test('nobody decisive having voted is not a pass', () => {
    assert.equal(
      voteSucceeded(
        { forVotes: 0n, againstVotes: 0n, abstainVotes: strat(10_000n) },
        5001n,
      ),
      false,
      'a proposal with only abstentions has no majority, as the contract guards with decisive == 0',
    );
  });

  test('a proposal needs both conditions, and the tally says which is missing', () => {
    const quorum = strat(1_000n);

    const supportedButQuiet = tallyOf(
      { forVotes: strat(100n), againstVotes: 0n, abstainVotes: 0n },
      quorum,
      5001n,
    );
    assert.equal(supportedButQuiet.hasMajority, true);
    assert.equal(supportedButQuiet.hasQuorum, false);
    assert.equal(supportedButQuiet.willPass, false);
    assert.equal(supportedButQuiet.forShare, 100);

    const busyButUnpopular = tallyOf(
      { forVotes: strat(400n), againstVotes: strat(600n), abstainVotes: 0n },
      quorum,
      5001n,
    );
    assert.equal(busyButUnpopular.hasMajority, false);
    assert.equal(busyButUnpopular.willPass, false);

    const passing = tallyOf(
      {
        forVotes: strat(900n),
        againstVotes: strat(100n),
        abstainVotes: strat(200n),
      },
      quorum,
      5001n,
    );
    assert.equal(passing.hasQuorum, true);
    assert.equal(passing.hasMajority, true);
    assert.equal(passing.willPass, true);
  });

  test('a quorum bar cannot overflow its track', () => {
    const tally = tallyOf(
      { forVotes: strat(10_000n), againstVotes: 0n, abstainVotes: 0n },
      strat(100n),
      5001n,
    );
    assert.equal(tally.quorumShare, 100);
  });

  test('a zero quorum reads as reached rather than dividing by zero', () => {
    const tally = tallyOf(
      { forVotes: 0n, againstVotes: 0n, abstainVotes: 0n },
      0n,
      5001n,
    );
    assert.equal(tally.quorumShare, 100);
    assert.equal(tally.hasQuorum, true);
    assert.equal(Number.isFinite(tally.quorumShare), true);
  });
});

/** Log scans must stay under the RPC's 10M-block span limit. */
describe('log windows stay inside what the endpoint allows', () => {
  test('a span under the limit is one request', () => {
    const windows = logWindows(100n, 500n);
    assert.deepEqual(windows, [{ from: 100n, to: 500n }]);
  });

  test('nothing to scan asks for nothing', () => {
    assert.deepEqual(logWindows(500n, 499n), []);
    assert.deepEqual(logWindows(500n, 100n), []);
  });

  test('a year of this chain is split into windows the node will answer', () => {
    const deploy = 84_329_211n;
    const latest = deploy + 843_000n * 365n;
    const windows = logWindows(deploy, latest);

    assert.ok(windows.length > 1, 'a year cannot be one request');
    for (const window of windows) {
      const span = window.to - window.from + 1n;
      assert.ok(
        span <= MAX_LOG_SPAN,
        `window of ${span} blocks exceeds the ${MAX_LOG_SPAN} the endpoint allows`,
      );
    }

    assert.equal(windows[0].from, deploy);
    assert.equal(windows[windows.length - 1].to, latest);
    for (let i = 1; i < windows.length; i += 1) {
      assert.equal(
        windows[i].from,
        windows[i - 1].to + 1n,
        'a gap between windows would silently lose proposals',
      );
    }
  });

  test('an exact multiple of the limit does not produce an empty trailing window', () => {
    const windows = logWindows(1n, MAX_LOG_SPAN * 2n);
    assert.equal(windows.length, 2);
    assert.equal(windows[1].to, MAX_LOG_SPAN * 2n);
  });
});

describe('merging what a scan found', () => {
  const proposal = (id: bigint, block: bigint, track = 'params') => ({
    id,
    track,
    description: `#${id}`,
    proposer: '0x0000000000000000000000000000000000000001',
    targets: [],
    values: [],
    calldatas: [],
    voteStart: 0n,
    voteEnd: 0n,
    blockNumber: block,
  });

  test('re-reading the boundary block does not duplicate a proposal', () => {
    const merged = mergeProposals(
      [proposal(1n, 10n), proposal(2n, 20n)],
      [proposal(2n, 20n), proposal(3n, 30n)],
    );
    assert.deepEqual(
      merged.map((p) => p.id),
      [1n, 2n, 3n],
    );
  });

  test('the same id on two tracks is two proposals', () => {
    const merged = mergeProposals(
      [proposal(1n, 10n, 'params')],
      [proposal(1n, 10n, 'upgrade')],
    );
    assert.equal(merged.length, 2);
  });

  test('order is by block, oldest first', () => {
    const merged = mergeProposals(
      [proposal(9n, 90n)],
      [proposal(1n, 10n), proposal(5n, 50n)],
    );
    assert.deepEqual(
      merged.map((p) => p.blockNumber),
      [10n, 50n, 90n],
    );
  });
});

describe('the cache never becomes the reason a page cannot load', () => {
  const DEPLOY = 84_329_211n;
  const TRACKS = ['params', 'upgrade'];

  before(() => {
    const store = new Map<string, string>();
    (globalThis as { localStorage?: unknown }).localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
      clear: () => store.clear(),
    };
  });

  test('nothing stored means scan from the deployment block', () => {
    const read = readProposalCache(1, DEPLOY, TRACKS);
    assert.equal(read.scannedTo, DEPLOY - 1n);
    assert.deepEqual(read.found, []);
  });

  test('a round trip preserves the cursor and the bigints in a proposal', () => {
    const found = [
      {
        id: 2n ** 200n,
        track: 'params' as const,
        description: 'MIP-1: a thing\nbecause reasons',
        proposer: '0x00000000000000000000000000000000000000ab' as const,
        targets: ['0x00000000000000000000000000000000000000cd' as const],
        values: [0n],
        calldatas: ['0xdeadbeef' as const],
        voteStart: 1_790_000_000n,
        voteEnd: 1_790_600_000n,
        blockNumber: DEPLOY + 5n,
      },
    ];
    writeProposalCache(2, DEPLOY + 100n, found);

    const read = readProposalCache(2, DEPLOY, TRACKS);
    assert.equal(read.scannedTo, DEPLOY + 100n);
    assert.equal(read.found.length, 1);
    assert.equal(
      read.found[0].id,
      2n ** 200n,
      'an id past 2^53 must survive storage',
    );
    assert.equal(read.found[0].voteStart, 1_790_000_000n);
    assert.equal(read.found[0].description, 'MIP-1: a thing\nbecause reasons');
  });

  test('a cursor behind the deployment block is from a previous deployment and is discarded', () => {
    writeProposalCache(3, DEPLOY - 5_000n, []);
    const read = readProposalCache(3, DEPLOY, TRACKS);
    assert.equal(read.scannedTo, DEPLOY - 1n);
  });

  test('corrupt storage reads as nothing cached', () => {
    localStorage.setItem('mstrx.proposal-logs.v2.4', '{not json');
    const read = readProposalCache(4, DEPLOY, TRACKS);
    assert.equal(read.scannedTo, DEPLOY - 1n);
    assert.deepEqual(read.found, []);
  });

  test('a proposal on a track this build does not know is dropped, not crashed on', () => {
    writeProposalCache(5, DEPLOY + 1n, [
      {
        id: 1n,
        track: 'some-old-track' as never,
        description: 'x',
        proposer: '0x00000000000000000000000000000000000000ab' as const,
        targets: [],
        values: [],
        calldatas: [],
        voteStart: 0n,
        voteEnd: 0n,
        blockNumber: DEPLOY,
      },
    ]);
    const read = readProposalCache(5, DEPLOY, TRACKS);
    assert.deepEqual(read.found, []);
    assert.equal(read.scannedTo, DEPLOY + 1n, 'the cursor is still usable');
  });

  test('storage that throws on read is survivable', () => {
    const working = globalThis.localStorage;
    (globalThis as { localStorage: unknown }).localStorage = {
      getItem() {
        throw new Error('SecurityError: storage is disabled');
      },
      setItem() {
        throw new Error('SecurityError: storage is disabled');
      },
      removeItem() {},
    };

    const read = readProposalCache(6, DEPLOY, TRACKS);
    assert.equal(read.scannedTo, DEPLOY - 1n);
    assert.doesNotThrow(() => writeProposalCache(6, DEPLOY, []));

    (globalThis as { localStorage: unknown }).localStorage = working;
  });
});

/** Round-trips through the same catalogue the form uses. */
describe('proposal calls decode to what the catalogue describes', () => {
  const wrap = (target: `0x${string}`, calldata: `0x${string}`) =>
    encodeFunctionData({
      abi: AUTHORITY_ABI,
      functionName: 'execute',
      args: [target, calldata],
    });

  test('a bps action round-trips to a percentage', () => {
    const action = PROPOSAL_ACTIONS.find((a) =>
      a.fields.some((f) => f.kind === 'bps'),
    );
    assert.ok(action, 'the catalogue should have at least one bps action');

    const placeholder = (kind: string): unknown => {
      if (kind === 'bps') return 250;
      if (kind === 'bool') return false;
      return 0n;
    };
    const args = action.fields.map((field) => placeholder(field.kind));
    const inner = encodeFunctionData({
      abi: action.abi,
      functionName: action.functionName,
      args,
    });

    const decoded = decodeCall(
      '0x0000000000000000000000000000000000000000',
      wrap(action.target, inner),
    );

    assert.equal(decoded.opaque, false);
    assert.equal(decoded.action?.key, action.key);
    assert.equal(decoded.target.toLowerCase(), action.target.toLowerCase());
    const bpsField = action.fields.find((f) => f.kind === 'bps');
    const shown = decoded.args.find((a) => a.label === bpsField.label);
    assert.equal(shown?.value, '2.5%', '250 bps is 2.5 per cent');
  });

  test('calldata that is not an authority call is reported as undecodable, not guessed at', () => {
    const decoded = decodeCall(
      '0x00000000000000000000000000000000000000ab',
      '0xdeadbeefdeadbeef',
    );
    assert.equal(decoded.opaque, true);
    assert.equal(decoded.action, null);
    assert.equal(decoded.calldata, '0xdeadbeefdeadbeef');
  });

  test('an authority call to something outside the catalogue is named as unrecognised', () => {
    const decoded = decodeCall(
      '0x0000000000000000000000000000000000000000',
      wrap('0x00000000000000000000000000000000000000ff', '0x12345678'),
    );
    // Well-formed, but no catalogue action matches.
    assert.equal(decoded.opaque, false);
    assert.equal(decoded.action, null);
    assert.equal(decoded.selector, '0x12345678');
  });

  test('empty calldata does not throw', () => {
    const decoded = decodeCall(
      '0x00000000000000000000000000000000000000ab',
      '0x',
    );
    assert.equal(decoded.opaque, true);
  });

  test('a multi-call proposal decodes every call', () => {
    const action = PROPOSAL_ACTIONS.find((a) => a.fields.length === 1);
    assert.ok(action);
    const inner = encodeFunctionData({
      abi: action.abi,
      functionName: action.functionName,
      args: [action.fields[0].kind === 'bps' ? 100 : 1n],
    });
    const calls = decodeProposalCalls(
      [
        '0x0000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000',
      ],
      [wrap(action.target, inner), '0xbadbad'],
    );
    assert.equal(calls.length, 2);
    assert.equal(calls[0].action?.key, action.key);
    assert.equal(calls[1].opaque, true);
  });
});

describe('what a write has to refresh', () => {
  test('a read on the price-feed chain is left alone', () => {
    assert.equal(
      isAffectedByProtocolWrite([
        'readContract',
        { chainId: 1, functionName: 'latestRoundData' },
      ]),
      false,
    );
  });

  test('a read on the protocol chain is refreshed', () => {
    assert.equal(
      isAffectedByProtocolWrite([
        'readContract',
        { chainId: 4663, functionName: 'getDashboard' },
      ]),
      true,
    );
  });

  test('a multicall touching the protocol chain is refreshed', () => {
    assert.equal(
      isAffectedByProtocolWrite([
        'readContracts',
        { contracts: [{ chainId: 1 }, { chainId: 4663 }] },
      ]),
      true,
    );
  });

  test('the index is left to catch up on its own', () => {
    assert.equal(isAffectedByProtocolWrite(['nav-history', 95_000]), false);
  });

  test('a key that names no chain is refreshed rather than skipped', () => {
    assert.equal(isAffectedByProtocolWrite(['proposal-logs', 4663]), true);
    assert.equal(isAffectedByProtocolWrite(['something-new']), true);
  });
});

describe('formatting', () => {
  test('votes read as magnitudes, and a tally past 2^53 does not lose precision', () => {
    assert.equal(formatVotes(strat(1n)), '1.00');
    assert.equal(formatVotes(strat(1_500n)), '1.5k');
    assert.equal(formatVotes(strat(2_500_000n)), '2.50M');
    assert.equal(formatVotes(0n), '0.00');
    // 1e25 wei exceeds double precision.
    assert.equal(formatVotes(strat(10_000_000n)), '10.00M');
  });

  test('a countdown is driven by a supplied clock and floors at zero', () => {
    assert.equal(secondsUntil(1_000n, 400), 600);
    assert.equal(secondsUntil(1_000n, 1_000), 0);
    assert.equal(
      secondsUntil(1_000n, 5_000),
      0,
      'a past deadline is never negative',
    );
  });

  test('durations read the way a person would say them', () => {
    assert.equal(formatDuration(0), 'a moment');
    assert.equal(formatDuration(-5), 'a moment');
    assert.equal(formatDuration(45), '45s');
    assert.equal(formatDuration(600), '10m');
    assert.equal(formatDuration(3 * 3600 + 20 * 60), '3h 20m');
    assert.equal(formatDuration(2 * 86_400 + 4 * 3600), '2d 4h');
    assert.equal(formatDuration(30 * 86_400), '30d 0h');
  });
});
