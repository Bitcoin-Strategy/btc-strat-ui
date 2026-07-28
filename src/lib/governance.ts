import { ADDRESSES } from './addresses';

export const PHASE = { Genesis: 0, Dao: 1 } as const;

/** Same governor deployed twice. The authority enforces which track an action needs. */
export const TRACKS = [
  {
    key: 'params',
    label: 'Parameters',
    address: ADDRESSES.PARAMS_GOVERNOR,
    timelock: ADDRESSES.PARAMS_TIMELOCK,
    blurb: 'Bands, windows, rates, capacities — everything the protocol tunes.',
  },
  {
    key: 'upgrade',
    label: 'Upgrades',
    address: ADDRESSES.UPGRADE_GOVERNOR,
    timelock: ADDRESSES.UPGRADE_TIMELOCK,
    blurb:
      'Module code, ownership, the price feed and the liquidity adapter. Higher quorum, supermajority, longer delay.',
  },
] as const;

export type TrackKey = (typeof TRACKS)[number]['key'];

export const trackFor = (key: TrackKey) =>
  TRACKS.find((t) => t.key === key) ?? TRACKS[0];

export const PROPOSAL_STATE = [
  'Pending',
  'Active',
  'Canceled',
  'Defeated',
  'Succeeded',
  'Queued',
  'Expired',
  'Executed',
] as const;

export type ProposalState = (typeof PROPOSAL_STATE)[number];

export const stateName = (state: number): ProposalState =>
  PROPOSAL_STATE[state] ?? 'Pending';

export const VOTE = { Against: 0, For: 1, Abstain: 2 } as const;
export type VoteSupport = (typeof VOTE)[keyof typeof VOTE];

export const canVote = (state: ProposalState) => state === 'Active';
export const canQueue = (state: ProposalState) => state === 'Succeeded';
export const canExecute = (state: ProposalState) => state === 'Queued';

/** By convention the first line of the description is the title. */
export const proposalTitle = (description: string) => {
  const [first] = description.split('\n');
  return first?.replace(/^#+\s*/, '').trim() || 'Untitled proposal';
};

export const proposalBody = (description: string) =>
  description.split('\n').slice(1).join('\n').trim();

/** `now` is passed in so countdowns can run on chain time. */
export const secondsUntil = (unixSeconds: bigint, now: number): number => {
  const remaining = Number(unixSeconds) - now;
  return remaining > 0 ? remaining : 0;
};

export const formatDuration = (seconds: number): string => {
  if (seconds <= 0) return 'a moment';

  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
};

export const timeUntil = (unixSeconds: bigint): string => {
  const remaining = Number(unixSeconds) - Math.floor(Date.now() / 1000);
  return remaining <= 0 ? 'ended' : formatDuration(remaining);
};

const BPS_DENOM = 10_000n;

export type Votes = {
  forVotes: bigint;
  againstVotes: bigint;
  abstainVotes: bigint;
};

/** `GovernorCountingSimple` counts for + abstain toward quorum; against is excluded. */
export const quorumVotesOf = (votes: Votes): bigint =>
  votes.forVotes + votes.abstainVotes;

export const quorumReached = (votes: Votes, quorum: bigint): boolean =>
  quorumVotesOf(votes) >= quorum;

/** Mirrors `StratGovernor._voteSucceeded` over decisive votes. */
export const voteSucceeded = (votes: Votes, majorityBps: bigint): boolean => {
  const decisive = votes.forVotes + votes.againstVotes;
  if (decisive === 0n) return false;
  return votes.forVotes * BPS_DENOM >= decisive * majorityBps;
};

/** `willPass` needs both quorum and majority. */
export const tallyOf = (
  votes: Votes,
  quorum: bigint,
  majorityBps: bigint,
): {
  /** 0-100; abstentions are not decisive. */
  forShare: number;
  requiredShare: number;
  quorumShare: number;
  /** For plus abstain. */
  countedVotes: bigint;
  hasQuorum: boolean;
  hasMajority: boolean;
  willPass: boolean;
} => {
  const decisive = votes.forVotes + votes.againstVotes;
  const counted = quorumVotesOf(votes);
  const hasQuorum = quorumReached(votes, quorum);
  const hasMajority = voteSucceeded(votes, majorityBps);

  return {
    forShare:
      decisive === 0n ? 0 : Number((votes.forVotes * 10_000n) / decisive) / 100,
    requiredShare: Number(majorityBps) / 100,
    quorumShare:
      quorum === 0n
        ? 100
        : Math.min(Number((counted * 10_000n) / quorum) / 100, 100),
    countedVotes: counted,
    hasQuorum,
    hasMajority,
    willPass: hasQuorum && hasMajority,
  };
};
