import { useQueryClient } from '@tanstack/react-query';
import { Info, Lock, ShieldAlert } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useRedeemFlow } from '../../hooks/use-redeem-flow';
import { useStakeFlow } from '../../hooks/use-stake-flow';
import { useStakingData } from '../../hooks/use-staking-data';
import { useTokenBalance } from '../../hooks/use-token-balance';
import { useUnstakeFlow } from '../../hooks/use-unstake-flow';
import { useWithdrawFlow } from '../../hooks/use-withdraw-flow';
import { ADDRESSES } from '../../lib/addresses';
import { describeError } from '../../lib/errors';
import { refreshAfterWrite } from '../../lib/invalidate';
import {
  cn,
  formatDuration,
  formatter,
  handleNumberKeyDown,
  sanitizeNumberInput,
} from '../../lib/utils';

function validateAmount(
  amount: string,
  balance: number,
  errorSetter: (error: string) => void,
  balanceLabel: string,
) {
  if (!amount || parseFloat(amount) <= 0) {
    errorSetter('');
    return false;
  }

  const numAmount = parseFloat(amount);
  if (numAmount > balance) {
    errorSetter(
      `Insufficient ${balanceLabel}. You have ${balance.toFixed(4)} $STRAT${balanceLabel === 'staked balance' ? ' staked' : ''}`,
    );
    return false;
  }

  errorSetter('');
  return true;
}

function StakeTab({
  stakeAmount,
  setStakeAmount,
  stakeValidationError,
  isLoadingBalance,
  stratBalanceFormatted,
  handleStakeClick,
  canStake,
  isStakeValid,
  buttonText,
  stakeError,
  currentThf,
  thfMax,
  thfMaxTime,
  hasActiveStake,
}: {
  stakeAmount: string;
  setStakeAmount: (value: string) => void;
  stakeValidationError: string;
  isLoadingBalance: boolean;
  stratBalanceFormatted: string;
  handleStakeClick: () => void;
  canStake: boolean;
  isStakeValid: boolean;
  buttonText: string;
  stakeError: Error | null;
  currentThf: number;
  thfMax: number;
  thfMaxTime: number;
  hasActiveStake: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="flex gap-3 rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
        <Info className="shrink-0 text-blue-500" size={20} />
        <p className="text-sm text-blue-200">
          Staking starts your &ldquo;Time Held&rdquo; clock. You must be staked
          to redeem, and your stake keeps its vote. Adding to a stake does not
          restart the clock: its age becomes the amount-weighted average of what
          was there and what you added.
        </p>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <label htmlFor="stake-amount" className="text-muted text-sm">
            Amount to Stake
          </label>
          <span className="text-muted text-xs">
            Balance:{' '}
            {isLoadingBalance ? (
              '...'
            ) : (
              <button
                type="button"
                onClick={() => setStakeAmount(stratBalanceFormatted)}
                className="hover:text-orange font-mono underline"
              >
                {formatter.format(Number(stratBalanceFormatted))} $STRAT
              </button>
            )}
          </span>
        </div>
        <div className="relative">
          <input
            id="stake-amount"
            type="number"
            value={stakeAmount}
            onChange={(e) =>
              setStakeAmount(sanitizeNumberInput(e.target.value))
            }
            onKeyDown={handleNumberKeyDown}
            placeholder="0.00"
            className={`w-full rounded-lg border p-3 font-mono text-white focus:outline-none ${
              stakeValidationError
                ? 'border-red focus:border-red bg-red/5'
                : 'border-border bg-dark focus:border-orange'
            }`}
          />
          <span className="text-muted absolute right-3 top-3 font-mono">
            $STRAT
          </span>
        </div>
        {stakeValidationError && (
          <div className="text-red mt-2 text-xs">{stakeValidationError}</div>
        )}
      </div>

      <div className="bg-dark space-y-2 rounded-lg p-4">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="text-muted">Current Multiplier</span>
          <span className="min-w-0 break-all text-right font-mono text-white">
            {hasActiveStake ? `${currentThf.toFixed(2)}x` : 'Not staked yet'}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="text-muted">
            Max Multiplier
            {thfMaxTime > 0 ? ` (${formatDuration(thfMaxTime)})` : ''}
          </span>
          <span className="text-green min-w-0 break-all text-right font-mono">
            {thfMax.toFixed(2)}x
          </span>
        </div>
      </div>

      <button
        onClick={handleStakeClick}
        disabled={!canStake || !isStakeValid}
        className="bg-orange hover:bg-orange/90 w-full rounded-lg py-3 font-bold text-black transition-all disabled:cursor-not-allowed disabled:bg-gray-500 disabled:hover:bg-gray-500"
      >
        {buttonText}
      </button>
      {stakeError && (
        <p className="text-red mt-2 text-center text-xs">
          {describeError(stakeError).detail}
        </p>
      )}
    </div>
  );
}

function RedeemTab({
  redeemAmount,
  setRedeemAmount,
  redeemValidationError,
  isLoadingBalance,
  stakedAmount,
  stakedAmountFormatted,
  preview,
  handleRedeemClick,
  canRedeem,
  isRedeemValid,
  redeemButtonText,
  redeemError,
  handleUnstakeClick,
  canUnstake,
  isUnstakeValid,
  unstakeButtonText,
  unstakeError,
  withdraw,
}: {
  redeemAmount: string;
  setRedeemAmount: (value: string) => void;
  redeemValidationError: string;
  isLoadingBalance: boolean;
  stakedAmount: number;
  stakedAmountFormatted: string;
  preview: {
    isLoading: boolean;
    grossBtc: string;
    effPenaltyBtc: string;
    thfBonusBtc: string;
    netBtc: string;
    remainingRcap: string;
    isRcapExhausted: boolean;
  };
  handleRedeemClick: () => void;
  canRedeem: boolean;
  isRedeemValid: boolean;
  redeemButtonText: string;
  redeemError: Error | null;
  handleUnstakeClick: () => void;
  canUnstake: boolean;
  isUnstakeValid: boolean;
  unstakeButtonText: string;
  unstakeError: Error | null;
  withdraw: {
    execute: () => void;
    buttonText: string;
    pendingAmountFormatted: string;
    hasPending: boolean;
    isReady: boolean;
    canExecute: boolean;
    error: Error | null;
  };
}) {
  let thfBonusText = '...';
  if (!preview.isLoading) {
    const sign = preview.thfBonusBtc.startsWith('-') ? '' : '+';
    thfBonusText = `${sign}${preview.thfBonusBtc} BTC`;
  }

  return (
    <div className="space-y-6">
      <div className="border-red/20 bg-red/10 flex gap-3 rounded-lg border p-4">
        <ShieldAlert className="text-red shrink-0" size={20} />
        <div className="text-sm text-red-200">
          <p className="mb-1 font-bold">Quadratic Penalty Active</p>
          <p>
            Redeeming affects the protocol health. Large redemptions incur
            exponential penalties remaining in the treasury.
          </p>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <label htmlFor="redeem-amount" className="text-muted text-sm">
            Redeem Amount
          </label>
          <span className="text-muted text-xs">
            Staked:{' '}
            {isLoadingBalance ? (
              '...'
            ) : (
              <button
                type="button"
                onClick={() =>
                  setRedeemAmount(sanitizeNumberInput(stakedAmountFormatted))
                }
                className="hover:text-orange font-mono underline"
              >
                {formatter.format(stakedAmount)} $STRAT
              </button>
            )}
          </span>
        </div>
        <div className="relative">
          <input
            id="redeem-amount"
            type="number"
            value={redeemAmount}
            onChange={(e) =>
              setRedeemAmount(sanitizeNumberInput(e.target.value))
            }
            onKeyDown={handleNumberKeyDown}
            placeholder="0.00"
            className={`w-full rounded-lg border p-3 font-mono text-white focus:outline-none ${
              redeemValidationError
                ? 'border-red focus:border-red bg-red/5'
                : 'border-border bg-dark focus:border-red'
            }`}
          />
          <span className="text-muted absolute right-3 top-3 font-mono">
            $STRAT
          </span>
        </div>
        {redeemValidationError && (
          <div className="text-red mt-2 text-xs">{redeemValidationError}</div>
        )}
      </div>

      <div className="border-border space-y-2 border-t pt-4">
        <div className="flex justify-between gap-3 text-sm">
          <span className="text-muted">Gross Value (NAV)</span>
          <span className="text-white">
            {preview.isLoading ? '...' : `${preview.grossBtc} BTC`}
          </span>
        </div>
        <div className="flex justify-between gap-3 text-sm">
          <span className="text-muted">Quadratic Penalty</span>
          <span className="text-red">
            {preview.isLoading ? '...' : `-${preview.effPenaltyBtc} BTC`}
          </span>
        </div>
        <div className="flex justify-between gap-3 text-sm">
          <span className="text-muted">TimeHeld Bonus</span>
          <span className="text-green">{thfBonusText}</span>
        </div>
        <div className="border-border flex justify-between gap-3 border-t pt-2 font-bold">
          <span className="text-white">Net Receive</span>
          <span className="text-white">
            {preview.isLoading ? '...' : `${preview.netBtc} BTC`}
          </span>
        </div>
        <div className="flex justify-between gap-3 pt-2 text-sm">
          <span className="text-muted">Remaining Redemption Capacity</span>
          <span className="font-mono text-white">
            {preview.isLoading
              ? '...'
              : `${Number(preview.remainingRcap).toFixed(2)} STRAT`}
          </span>
        </div>
      </div>

      {preview.isRcapExhausted && (
        <div className="border-red/20 bg-red/10 flex gap-3 rounded-lg border p-4">
          <ShieldAlert className="text-red shrink-0" size={20} />
          <p className="text-sm text-red-200">
            Redemption capacity has been exhausted for this epoch. Please try
            again in the next epoch.
          </p>
        </div>
      )}

      <button
        onClick={handleRedeemClick}
        disabled={!canRedeem || !isRedeemValid || preview.isRcapExhausted}
        className="border-red/50 bg-red/20 text-red hover:bg-red disabled:hover:bg-red/20 w-full rounded-lg border py-3 font-bold transition-all hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {preview.isRcapExhausted
          ? 'Redemption Capacity Exhausted'
          : redeemButtonText}
      </button>
      {redeemError && (
        <p className="text-red mt-2 text-center text-xs">
          {describeError(redeemError).detail}
        </p>
      )}

      <button
        onClick={handleUnstakeClick}
        disabled={!canUnstake || !isUnstakeValid}
        className="bg-orange hover:bg-orange/90 w-full rounded-lg py-3 font-bold text-black transition-all disabled:cursor-not-allowed disabled:bg-gray-500 disabled:hover:bg-gray-500"
      >
        {unstakeButtonText}
      </button>
      {unstakeError && (
        <p className="text-red mt-2 text-center text-xs">
          {describeError(unstakeError).detail}
        </p>
      )}

      {/* Requesting only books the amount; the withdraw button collects it. */}
      {withdraw.hasPending && (
        <div className="border-orange/30 bg-orange/10 mt-4 rounded-lg border p-4">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <span className="text-sm text-gray-300">
              Waiting to be withdrawn
            </span>
            <span className="text-orange font-bold">
              {withdraw.pendingAmountFormatted} $STRAT
            </span>
          </div>
          <p className="mb-3 text-xs text-gray-400">
            {withdraw.isReady
              ? 'The cooldown has finished. Collect it whenever you like.'
              : 'Unstaking runs a cooldown first. Asking again restarts it on everything waiting.'}
          </p>
          <button
            onClick={withdraw.execute}
            disabled={!withdraw.canExecute}
            className="bg-orange hover:bg-orange/90 w-full rounded-lg py-3 font-bold text-black transition-all disabled:cursor-not-allowed disabled:bg-gray-500 disabled:hover:bg-gray-500"
          >
            {withdraw.buttonText}
          </button>
          {withdraw.error && (
            <p className="text-red mt-2 text-center text-xs">
              {describeError(withdraw.error).detail}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function StakingPosition({
  isLoading,
  hasActiveStake,
  stakedAmount,
  currentThf,
  thfMax,
  timeStakedSeconds,
  timeToMaxSeconds,
  onStartStaking,
}: {
  isLoading: boolean;
  hasActiveStake: boolean;
  stakedAmount: number;
  currentThf: number;
  thfMax: number;
  timeStakedSeconds: number;
  timeToMaxSeconds: number;
  onStartStaking: () => void;
}) {
  if (isLoading) {
    return (
      <div className="text-muted flex flex-col items-center justify-center py-8">
        <div className="mb-4">Loading...</div>
      </div>
    );
  }

  if (!hasActiveStake) {
    return (
      <div className="text-muted flex flex-col items-center justify-center py-8">
        <Lock size={48} className="mb-4 opacity-20" />
        <p>No active stake found.</p>
        <button
          onClick={onStartStaking}
          className="text-orange mt-2 text-sm hover:underline"
        >
          Start Staking
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-dark rounded-lg p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-muted text-sm">Staked Amount</span>
          <span className="font-mono text-lg font-bold text-white">
            {formatter.format(stakedAmount)} $STRAT
          </span>
        </div>

        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-muted text-sm">Current Multiplier</span>
          <span className="text-green font-mono font-bold">
            {currentThf.toFixed(2)}x
          </span>
        </div>

        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-muted text-sm">Max Multiplier</span>
          <span className="text-green font-mono">{thfMax.toFixed(2)}x</span>
        </div>

        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-muted text-sm">Time Staked</span>
          <span className="font-mono text-white">
            {formatDuration(timeStakedSeconds)}
          </span>
        </div>

        {timeToMaxSeconds > 0 && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted text-sm">Time to Max</span>
            <span className="font-mono text-white">
              {formatDuration(timeToMaxSeconds)}
            </span>
          </div>
        )}
      </div>

      <div className="bg-dark rounded-lg p-4">
        <div className="mb-2 text-sm font-medium text-white">
          Multiplier Progress
        </div>
        <div className="bg-dark-border relative h-3 rounded-full">
          <div
            className="bg-green absolute left-0 top-0 h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, (currentThf / thfMax) * 100)}%`,
            }}
          />
        </div>
        <div className="mt-1 flex justify-between gap-3 text-xs text-gray-400">
          <span>1.00x</span>
          <span>{thfMax.toFixed(2)}x</span>
        </div>
      </div>
    </div>
  );
}

export function Redemption() {
  const queryClient = useQueryClient();
  const [stakeAmount, setStakeAmount] = useState('');
  const [redeemAmount, setRedeemAmount] = useState('');
  const [tab, setTab] = useState<'stake' | 'redeem'>('stake');
  const [stakeValidationError, setStakeValidationError] = useState<string>('');
  const [redeemValidationError, setRedeemValidationError] =
    useState<string>('');

  const {
    formattedBalance: stratBalanceFormatted,
    isLoading: isLoadingBalance,
  } = useTokenBalance({
    tokenAddress: ADDRESSES.STRAT,
    decimals: 18,
  });

  const handleStakeSuccess = useCallback(() => {
    setStakeAmount('');
    void refreshAfterWrite(queryClient);
  }, [queryClient]);

  const handleRedeemSuccess = useCallback(() => {
    setRedeemAmount('');
    void refreshAfterWrite(queryClient);
  }, [queryClient]);

  const handleUnstakeSuccess = useCallback(() => {
    setRedeemAmount('');
    void refreshAfterWrite(queryClient);
  }, [queryClient]);

  const {
    execute: handleStakeClick,
    canExecute: canStake,
    buttonText,
    error: stakeError,
  } = useStakeFlow({
    amount: stakeAmount,
    enabled: tab === 'stake',
    onSuccess: handleStakeSuccess,
  });

  const {
    stakedAmount,
    stakedAmountFormatted,
    currentThf,
    thfMin,
    thfMax,
    thfMaxTime,
    timeStakedSeconds,
    timeToMaxSeconds,
    hasActiveStake,
    isLoading: isLoadingStaking,
  } = useStakingData();

  const {
    execute: handleRedeemClick,
    canExecute: canRedeem,
    buttonText: redeemButtonText,
    error: redeemError,
    preview,
  } = useRedeemFlow({
    amount: redeemAmount,
    enabled: tab === 'redeem',
    onSuccess: handleRedeemSuccess,
  });

  const {
    execute: handleUnstakeClick,
    canExecute: canUnstake,
    buttonText: unstakeButtonText,
    error: unstakeError,
  } = useUnstakeFlow({
    amount: redeemAmount,
    enabled: tab === 'redeem',
    onSuccess: handleUnstakeSuccess,
  });

  const withdraw = useWithdrawFlow({
    enabled: tab === 'redeem',
    onSuccess: handleUnstakeSuccess,
  });

  useEffect(() => {
    if (tab === 'stake') {
      validateAmount(
        stakeAmount,
        parseFloat(stratBalanceFormatted || '0'),
        setStakeValidationError,
        'balance',
      );
    }
  }, [stakeAmount, stratBalanceFormatted, tab]);

  useEffect(() => {
    if (tab === 'redeem') {
      validateAmount(
        redeemAmount,
        stakedAmount,
        setRedeemValidationError,
        'staked balance',
      );
    }
  }, [redeemAmount, stakedAmount, tab]);

  const isStakeValid =
    !stakeValidationError && !!stakeAmount && parseFloat(stakeAmount) > 0;
  const isRedeemValid =
    !redeemValidationError && !!redeemAmount && parseFloat(redeemAmount) > 0;

  // Linear from thfMin to thfMax over thfMaxTime, which is governable.
  const multiplierData = Array.from({ length: 25 }, (_, i) => {
    const fraction = i / 24;
    const elapsed = thfMaxTime * fraction;
    return {
      elapsed: thfMaxTime > 0 ? formatDuration(elapsed) : `${i}`,
      multiplier: Number((thfMin + (thfMax - thfMin) * fraction).toFixed(3)),
    };
  });

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl">
          Staking & Redemption
        </h1>
        <p className="text-muted max-w-3xl">
          Stake $STRAT to accrue{' '}
          <span className="text-orange font-mono">TimeHeldFactor</span>.
          Redemptions are possible at NAV but subject to a{' '}
          <span className="text-red font-bold">Quadratic Penalty</span> based on
          redemption size relative to supply. Long-term stakers reduce
          penalties.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="border-border bg-card overflow-hidden rounded-xl border">
          <div className="border-border flex border-b">
            <button
              onClick={() => setTab('stake')}
              className={cn(
                'flex-1 py-4 text-center font-medium transition-colors',
                tab === 'stake'
                  ? 'border-orange bg-dark text-orange border-b-2'
                  : 'text-muted hover:text-white',
              )}
            >
              Stake $STRAT
            </button>
            <button
              onClick={() => setTab('redeem')}
              className={cn(
                'flex-1 py-4 text-center font-medium transition-colors',
                tab === 'redeem'
                  ? 'border-red bg-dark text-red border-b-2'
                  : 'text-muted hover:text-white',
              )}
            >
              Redeem for BTC
            </button>
          </div>

          <div className="p-6">
            {tab === 'stake' ? (
              <StakeTab
                stakeAmount={stakeAmount}
                setStakeAmount={setStakeAmount}
                stakeValidationError={stakeValidationError}
                isLoadingBalance={isLoadingBalance}
                stratBalanceFormatted={stratBalanceFormatted}
                handleStakeClick={handleStakeClick}
                canStake={canStake}
                isStakeValid={isStakeValid}
                buttonText={buttonText}
                stakeError={stakeError}
                currentThf={currentThf}
                thfMax={thfMax}
                thfMaxTime={thfMaxTime}
                hasActiveStake={hasActiveStake}
              />
            ) : (
              <RedeemTab
                redeemAmount={redeemAmount}
                setRedeemAmount={setRedeemAmount}
                redeemValidationError={redeemValidationError}
                isLoadingBalance={isLoadingBalance}
                stakedAmount={stakedAmount}
                stakedAmountFormatted={stakedAmountFormatted}
                preview={preview}
                handleRedeemClick={handleRedeemClick}
                canRedeem={canRedeem}
                isRedeemValid={isRedeemValid}
                redeemButtonText={redeemButtonText}
                redeemError={redeemError}
                handleUnstakeClick={handleUnstakeClick}
                canUnstake={canUnstake}
                isUnstakeValid={isRedeemValid}
                unstakeButtonText={unstakeButtonText}
                unstakeError={unstakeError}
                withdraw={withdraw}
              />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="border-border bg-card rounded-xl border p-6">
            <h3 className="mb-4 text-lg font-bold text-white">
              TimeHeldFactor Curve
            </h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={multiplierData}>
                  <defs>
                    <linearGradient id="colorMult" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F7931A" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F7931A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#2A3441"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="elapsed"
                    stroke="#94A3B8"
                    fontSize={10}
                    interval={5}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={10}
                    domain={[0, Math.max(thfMax, 1) * 1.1]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#151A21',
                      border: 'none',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="multiplier"
                    stroke="#F7931A"
                    fillOpacity={1}
                    fill="url(#colorMult)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-muted mt-2 text-center text-xs">
              {thfMaxTime > 0
                ? `Climbs from ${thfMin.toFixed(2)}x to ${thfMax.toFixed(2)}x over ${formatDuration(thfMaxTime)}`
                : 'Reading the curve from the contract…'}
            </p>
          </div>

          <div className="border-border bg-card rounded-xl border p-6">
            <h3 className="mb-4 text-lg font-bold text-white">
              Your Staking Position
            </h3>
            <StakingPosition
              isLoading={isLoadingStaking}
              hasActiveStake={hasActiveStake}
              stakedAmount={stakedAmount}
              currentThf={currentThf}
              thfMax={thfMax}
              timeStakedSeconds={timeStakedSeconds}
              timeToMaxSeconds={timeToMaxSeconds}
              onStartStaking={() => setTab('stake')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
