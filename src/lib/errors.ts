import { ERROR_SELECTORS } from './abi/error-selectors';
import { PROTOCOL_CHAIN } from './chains';

/** Turns a failure into a sentence. Raw hex never reaches the screen; the original goes to the console. */

export type ErrorKind =
  // User rejection; never shown as an error.
  'rejected' | 'wallet' | 'contract' | 'unknown';

export type DescribedError = {
  kind: ErrorKind;
  title: string;
  detail: string;
  name?: string;
};

/** Only errors a user can actually hit; the rest fall back to their name. */
const CONTRACT_MESSAGES: Record<string, string> = {
  SeriesNotOpen:
    'This series is not open yet, or has already closed. Check its window on the bonding page.',
  SeriesInactive: 'This series has been closed and no longer accepts bonds.',
  SeriesNotFound: 'No such series.',
  SeriesAlreadyLive:
    'A series is already live. Close it before opening another — only one runs at a time.',
  SeriesRetired: 'This series has been retired.',
  CapacityExceeded:
    'The series cannot promise that much STRAT. Bond less, or check how much capacity is left.',
  CapacityAboveBacking:
    'The series would promise more STRAT than the vesting vault is holding to back it.',
  BelowMinPurchase: 'This bond is under the series minimum.',
  PriceBelowNav:
    'At that price the Treasury’s share would be worth less than the STRAT is already backed by, so the protocol refuses to sell.',
  InvalidVestingTerm:
    'The vesting term must be more than zero and at most two years.',
  InvalidWindow:
    'The closing time has to be later than the opening time and in the future.',
  InvalidCapacity: 'Capacity has to be greater than zero.',
  InvalidPrice: 'The price has to be greater than zero.',
  LiquidityLegOutOfGas:
    'The transaction was sent with too little gas for the liquidity step. Let the wallet estimate the gas rather than setting it by hand.',
  DevWalletNotSet: 'The dev wallet has not been configured yet.',

  PremiumNotPositive:
    'STRAT is not trading above its backing, so there is no premium to sell into.',
  OracleNotReady:
    'The pool cannot be priced yet — it needs a full TWAP window of trading history, or the Treasury has no backing yet.',
  InvalidNAV:
    'The Treasury has no backing yet, so nothing can be priced against it.',
  CapExceeded:
    'This window’s selling allowance is already used up. It resets with the next window.',
  SaleBelowNav:
    'The sale would clear below what the STRAT is backed by, so the contract refused it. Usually the pool is too thin for this size.',
  SwapOutputBelowMin:
    'The pool returned less than the floor allowed. Try a smaller size — the sale moves the price more than the slippage bound permits.',
  InsufficientOutput:
    'The pool could not fill this at an acceptable price. Try a smaller amount.',
  InvalidBands:
    'The bands do not tile the range: each one has to start where the last ended, end above where it started, and never sell less than a lower band. Setting up to 32 of them is allowed.',
  DeadlinePassed:
    'The transaction took too long to land and its deadline passed. Try again.',

  RedemptionDisabled:
    'Redemption is switched off. Turning it on is a governance decision.',
  RedemptionNotOpen:
    'The Treasury’s lock-up has not expired yet, so no bitcoin can leave.',
  EpochCapacityExceeded:
    'This epoch’s redemption capacity is used up. It resets when the next epoch starts.',
  InsufficientStake: 'You do not have that much staked.',
  PayoutBelowMin: 'The payout came out under the minimum you set.',
  ZeroPayout: 'That amount redeems to nothing.',
  BtcOutflowCapExceeded:
    'This would take more bitcoin out of the Treasury than its rate limit allows right now.',
  InsufficientTreasuryBtc:
    'The Treasury does not hold enough bitcoin for this.',
  WithdrawalNotReady: 'The unstaking cooldown has not finished yet.',
  NoPendingWithdrawal: 'There is nothing waiting to be withdrawn.',
  InvalidCooldown: 'That cooldown is outside what the contract allows.',

  NothingToClaim: 'Nothing has vested yet.',
  EmptyVestIds: 'No vests were selected.',
  IndexOutOfBounds: 'That vest does not exist.',
  NonTransferable:
    'VVEST cannot be moved. A vesting promise belongs to whoever earned it until it vests.',

  GovernanceNotActive:
    'Governance is not active yet. Proposals open once Genesis is finalized and the protocol is handed to the DAO.',
  NotController:
    'This wallet is not the protocol’s controller. During Genesis that is the admin; afterwards it is the timelock.',
  NotUpgradeController:
    'This call is reserved for the upgrade timelock, so it has to go through the upgrade track of governance.',
  NotGuardian: 'Only the guardian can do that.',
  GenesisAlreadyFinalized:
    'Genesis has already been finalized. There is no admin any more.',
  GovernorInsufficientProposerVotes:
    'You do not hold enough delegated STRAT to propose on this track.',
  GovernorUnexpectedProposalState:
    'The proposal is not at a stage where this action applies. Reload to see where it actually is.',
  GovernorAlreadyCastVote: 'This wallet has already voted on that proposal.',
  GovernorNonexistentProposal:
    'That proposal does not exist on this governor. If it was listed a moment ago, the list was stale — reload the page.',
  GovernorAlreadyQueuedProposal:
    'Somebody has already queued this proposal. Queueing is open to anyone, so another wallet got there first; the timelock is now counting down.',
  GovernorNotQueuedProposal:
    'This proposal has to be queued in the timelock before it can run.',
  GovernorRestrictedProposer:
    'This wallet is not allowed to propose on this track.',
  GovernorInvalidVoteType:
    'A vote has to be for, against or abstain, and this was none of them.',
  GovernorOnlyExecutor:
    'Only the timelock may make this call, which means it has to arrive as a passed proposal rather than directly.',
  GovernorUnableToCancel:
    'This proposal can no longer be cancelled. A proposer may withdraw one only while it is still pending.',
  GovernorInvalidProposalLength:
    'The proposal’s targets, values and calldata do not line up. Nothing was submitted.',
  GovernorQueueNotImplemented:
    'This governor has no timelock, so there is nothing to queue into.',
  GovernorInsufficientVotingPower:
    'This wallet had no voting weight at the moment the proposal was created. Weight has to be delegated before a proposal exists to count on it.',

  TimelockUnexpectedOperationState:
    'The timelock will not run this yet. A passed proposal waits out the track’s delay before it can be executed — the card shows when.',
  TimelockUnexecutedPredecessor:
    'An earlier queued operation has to run before this one.',
  TimelockUnauthorizedCaller:
    'Only the governor that queued this operation may make the timelock run it.',
  TimelockInsufficientDelay:
    'That delay is below the floor the timelock was deployed with.',
  TimelockInvalidOperationLength:
    'The queued operation’s arrays do not line up, so the timelock refused it.',

  SelectorNotDelegable:
    'That call can never be moved to the parameter track. Upgrades and ownership stay on the upgrade track permanently, by design.',
  NotATimelock: 'That address is not one of the protocol’s two timelocks.',
  GuardianPeriodOver:
    'The guardian’s veto window has expired. After it, a passed proposal can only be stopped by another proposal.',
  QuorumBelowFloor:
    'That quorum is below the floor fixed when the governor was deployed. Quorum may be raised, never lowered past it.',
  SettingBelowFloor:
    'That value is below the floor fixed when the governor was deployed, which exists so governance cannot vote away its own voting period.',
  InvalidGovernorConfig: 'The governor would not accept that configuration.',
  OwnableUnauthorizedAccount:
    'The protocol’s contracts are owned by ProtocolAuthority, so this has to go through it rather than being called directly.',
  AccessControlUnauthorizedAccount:
    'This wallet does not have the role that call requires.',
  EnforcedPause: 'That part of the protocol is paused.',
  ExpectedPause: 'That only applies while the protocol is paused.',

  OutflowRateAboveCeiling:
    'That rate is above the ceiling fixed when the Treasury was deployed. A rate may be lowered to be stricter, never raised.',
  InvalidThfParams:
    'The time held factors have to run minimum, neutral, maximum in that order, with none of them above 1.0 and a ramp longer than zero.',
  EpochRcapAboveTreasuryCap:
    'That capacity is more than the Treasury allows per epoch. The Treasury’s cap is a share of the STRAT that has actually been sold, so it grows as the protocol does.',
  InvalidEpochDuration: 'An epoch has to be at least one day long.',
  InvalidOutflowConfig:
    'That combination of outflow settings is outside what the Treasury accepts.',
  InvalidSwapConfig:
    'That slippage allowance is above what the contract permits.',
  InvalidConfig: 'That value is outside the range the contract permits.',
  InvalidWindowLength: 'A selling window has to be at least an hour long.',
  StakingMismatch:
    'That staking contract uses a different STRAT token or premium reserve than this Treasury does.',
  NotAuthorized: 'This wallet is not the address that call is reserved for.',
  NotSelf: 'That entry point can only be called by the contract itself.',

  ERC20InsufficientBalance: 'Your balance is too low for this.',
  ERC20InsufficientAllowance:
    'The contract is not approved to spend that much yet. Approve first.',
  ZeroAmount: 'The amount has to be greater than zero.',
  AddressZero: 'That address cannot be empty.',
  AlreadySet: 'That can only be set once, and it has been set already.',
  ExecutionNotConfigured:
    'The swap route or the liquidity position has not been wired up yet.',
  ReentrancyGuardReentrantCall:
    'That call re-entered the contract and was refused.',
};

const chainOf = (error: unknown): string => {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; depth < 8 && current; depth += 1) {
    const e = current as {
      message?: string;
      shortMessage?: string;
      details?: string;
      name?: string;
      cause?: unknown;
    };
    for (const piece of [e.shortMessage, e.message, e.details, e.name]) {
      if (typeof piece === 'string' && piece) parts.push(piece);
    }
    current = e.cause;
  }
  return parts.join('\n');
};

const contractErrorName = (
  error: unknown,
  text: string,
): string | undefined => {
  let current: unknown = error;
  for (let depth = 0; depth < 8 && current; depth += 1) {
    const e = current as { data?: { errorName?: string }; cause?: unknown };
    if (typeof e.data?.errorName === 'string') return e.data.errorName;
    current = e.cause;
  }

  // Reverts forwarded by ProtocolAuthority arrive undecoded, as a bare selector.
  const selector = text.match(/0x[0-9a-fA-F]{8}\b/)?.[0];
  if (selector && ERROR_SELECTORS[selector.toLowerCase()]) {
    return ERROR_SELECTORS[selector.toLowerCase()];
  }

  // Sometimes only the name survives, in the message text.
  const named = text.match(
    /reverted with(?: the following reason)?:?\s*([A-Z]\w{2,})/,
  );
  return named?.[1];
};

const humanise = (name: string): string =>
  name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase());

export const describeError = (error: unknown): DescribedError => {
  if (!error) {
    return { kind: 'unknown', title: 'Something went wrong', detail: '' };
  }

  const text = chainOf(error);

  if (
    /User rejected|User denied|rejected the request|ACTION_REJECTED|UserRejectedRequest/i.test(
      text,
    )
  ) {
    return {
      kind: 'rejected',
      title: 'Cancelled',
      detail: 'You dismissed the request in your wallet. Nothing was sent.',
    };
  }

  if (
    /does not match the target chain|ChainMismatch|chain of the wallet/i.test(
      text,
    )
  ) {
    return {
      kind: 'wallet',
      title: 'Wrong network',
      detail: `Your wallet is on another network. Switch it to ${PROTOCOL_CHAIN.name} and try again.`,
    };
  }

  if (
    /insufficient funds|exceeds the balance of the account|gas required exceeds/i.test(
      text,
    )
  ) {
    return {
      kind: 'wallet',
      title: 'Not enough gas',
      detail: `This wallet does not hold enough ${PROTOCOL_CHAIN.nativeCurrency.symbol} on ${PROTOCOL_CHAIN.name} to pay for the transaction.`,
    };
  }

  if (
    /nonce too low|already known|replacement transaction underpriced/i.test(
      text,
    )
  ) {
    return {
      kind: 'wallet',
      title: 'A transaction is already in flight',
      detail:
        'Your wallet has one pending with the same nonce. Wait for it to land, or speed it up in the wallet.',
    };
  }

  if (
    /HTTP request failed|fetch failed|timed out|Failed to fetch|network error/i.test(
      text,
    )
  ) {
    return {
      kind: 'wallet',
      title: 'The network did not answer',
      detail:
        'The RPC endpoint is unreachable right now. Try again in a moment.',
    };
  }

  const name = contractErrorName(error, text);
  if (name) {
    return {
      kind: 'contract',
      name,
      title: 'The protocol refused this',
      detail: CONTRACT_MESSAGES[name] ?? `${humanise(name)}.`,
    };
  }

  if (/reverted|execution reverted/i.test(text)) {
    return {
      kind: 'contract',
      title: 'The protocol refused this',
      detail:
        'The call was rejected on chain without a reason the app could read. The console has the full response.',
    };
  }

  return {
    kind: 'unknown',
    title: 'Something went wrong',
    detail: 'The console has the details.',
  };
};

export const reportError = (
  context: string,
  error: unknown,
): DescribedError => {
  const described = describeError(error);
  if (described.kind !== 'rejected') {
    console.error(
      `[${context}] ${described.title}: ${described.detail}`,
      error,
    );
  }
  return described;
};
