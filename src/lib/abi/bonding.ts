/**
 * Generated from `contracts/core/Bonding.sol` by
 * `node scripts/sync-abi.mjs`. Do not edit: re-run the script after a contract changes.
 */
export const BONDING_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "target",
        "type": "address"
      }
    ],
    "name": "AddressEmptyCode",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "AddressZero",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "AlreadySet",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "BelowMinPurchase",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "capacity",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "backing",
        "type": "uint256"
      }
    ],
    "name": "CapacityAboveBacking",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "CapacityExceeded",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "DevWalletNotSet",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "implementation",
        "type": "address"
      }
    ],
    "name": "ERC1967InvalidImplementation",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ERC1967NonPayable",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "EnforcedPause",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ExecutionNotConfigured",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ExpectedPause",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "FailedCall",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidCapacity",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidInitialization",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidOracleValue",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidPrice",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidRouting",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidSwapConfig",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidVestingTerm",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidWindow",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "LiquidityLegOutOfGas",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "caller",
        "type": "address"
      }
    ],
    "name": "NotGuardian",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotInitializing",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotSelf",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "OracleNotConfigured",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "netBtcPerStrat",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "navBtcPerStrat",
        "type": "uint256"
      }
    ],
    "name": "PriceBelowNav",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "RenounceOwnershipDisabled",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "bits",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "SafeCastOverflowedUintDowncast",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "SafeERC20FailedOperation",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "liveSeriesId",
        "type": "uint8"
      }
    ],
    "name": "SeriesAlreadyLive",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SeriesInactive",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SeriesLimitReached",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SeriesNotFound",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "startTime",
        "type": "uint64"
      },
      {
        "internalType": "uint64",
        "name": "endTime",
        "type": "uint64"
      }
    ],
    "name": "SeriesNotOpen",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "seriesId",
        "type": "uint8"
      }
    ],
    "name": "SeriesRetired",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "stratOut",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "minStratOut",
        "type": "uint256"
      }
    ],
    "name": "StratOutBelowMin",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "received",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "minOut",
        "type": "uint256"
      }
    ],
    "name": "SwapOutputBelowMin",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "UUPSUnauthorizedCallContext",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "slot",
        "type": "bytes32"
      }
    ],
    "name": "UUPSUnsupportedProxiableUUID",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "UnsupportedDecimals",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "VvestNotSet",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ZeroAmount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ZeroOutput",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint8",
        "name": "seriesId",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amountIn",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "stratPromised",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "vestingStart",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "vestingEnd",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "BondCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "wallet",
        "type": "address"
      }
    ],
    "name": "DevWalletSet",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "feeVault",
        "type": "address"
      }
    ],
    "name": "FeeVaultSet",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "version",
        "type": "uint64"
      }
    ],
    "name": "Initialized",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "bytes",
        "name": "reason",
        "type": "bytes"
      }
    ],
    "name": "LiquidityDeferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "btcUsed",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "stratUsed",
        "type": "uint256"
      }
    ],
    "name": "LiquidityDeployed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "bytes",
        "name": "reason",
        "type": "bytes"
      }
    ],
    "name": "LiquidityDrainDeferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "feeVault",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "btcFees",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "stratFees",
        "type": "uint256"
      }
    ],
    "name": "LiquidityFeesCollected",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "liquidityPosition",
        "type": "address"
      }
    ],
    "name": "LiquidityPositionUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferStarted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "Paused",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "priceOracle",
        "type": "address"
      }
    ],
    "name": "PriceOracleSet",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "toTreasury",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "toLiquidity",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "toDev",
        "type": "uint256"
      }
    ],
    "name": "ProceedsRouted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "treasuryBps",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "liquidityBps",
        "type": "uint16"
      },
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "devBps",
        "type": "uint16"
      }
    ],
    "name": "ProceedsRoutingUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint8",
        "name": "id",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "priceBtcPerStrat",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "startTime",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "endTime",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "vestingTerm",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "capacityMstrat",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "minPurchaseBtc",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "netBtcPerStrat",
        "type": "uint256"
      }
    ],
    "name": "SeriesCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint8",
        "name": "id",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "capacityMstrat",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "vestingTerm",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "endTime",
        "type": "uint64"
      }
    ],
    "name": "SeriesRetuned",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint8",
        "name": "id",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      }
    ],
    "name": "SeriesStatusUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "swapExecutor",
        "type": "address"
      }
    ],
    "name": "SwapExecutorUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "slippageBps",
        "type": "uint16"
      }
    ],
    "name": "SwapSlippageUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "Unpaused",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "implementation",
        "type": "address"
      }
    ],
    "name": "Upgraded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "vvest",
        "type": "address"
      }
    ],
    "name": "VvestSet",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "BTC_TOKEN",
    "outputs": [
      {
        "internalType": "contract IERC20",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_DEV_BPS",
    "outputs": [
      {
        "internalType": "uint16",
        "name": "",
        "type": "uint16"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_LIQUIDITY_BPS",
    "outputs": [
      {
        "internalType": "uint16",
        "name": "",
        "type": "uint16"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_SWAP_SLIPPAGE_BPS",
    "outputs": [
      {
        "internalType": "uint16",
        "name": "",
        "type": "uint16"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_VESTING_TERM",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MIN_LIQUIDITY_LEG_GAS",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MIN_VESTING_TERM",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "STRAT_TOKEN",
    "outputs": [
      {
        "internalType": "contract IERC20",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "TREASURY",
    "outputs": [
      {
        "internalType": "contract ITreasuryLike",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "UPGRADE_INTERFACE_VERSION",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "VESTING_VAULT",
    "outputs": [
      {
        "internalType": "contract IVestingVault",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "acceptOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "seriesId",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "amountIn",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "minStratOut",
        "type": "uint256"
      },
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "maxBtcIn",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "minStratOut",
            "type": "uint256"
          }
        ],
        "internalType": "struct IBonding.LiquidityExecution",
        "name": "liq",
        "type": "tuple"
      }
    ],
    "name": "bond",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "bondSwapSlippageBps",
    "outputs": [
      {
        "internalType": "uint16",
        "name": "",
        "type": "uint16"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "collectLiquidityFees",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "btcFees",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "stratFees",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "priceBtcPerStrat",
        "type": "uint256"
      },
      {
        "internalType": "uint64",
        "name": "startTime",
        "type": "uint64"
      },
      {
        "internalType": "uint64",
        "name": "endTime",
        "type": "uint64"
      },
      {
        "internalType": "uint256",
        "name": "vestingTerm",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "capacityMstrat",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "minPurchaseBtc",
        "type": "uint256"
      }
    ],
    "name": "createSeries",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "seriesId",
        "type": "uint8"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "maxBtcIn",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "minStratOut",
            "type": "uint256"
          }
        ],
        "internalType": "struct IBonding.LiquidityExecution",
        "name": "liq",
        "type": "tuple"
      }
    ],
    "name": "deployLiquidityFromBond",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "maxBtcIn",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "minStratOut",
            "type": "uint256"
          }
        ],
        "internalType": "struct IBonding.LiquidityExecution",
        "name": "liq",
        "type": "tuple"
      }
    ],
    "name": "deployPendingLiquidity",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "devBps",
    "outputs": [
      {
        "internalType": "uint16",
        "name": "",
        "type": "uint16"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "devWallet",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "feeVault",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "seriesId",
        "type": "uint8"
      }
    ],
    "name": "getRemainingCapacity",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "remaining",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "id",
        "type": "uint8"
      }
    ],
    "name": "getSeries",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint8",
            "name": "id",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "priceBtcPerStrat",
            "type": "uint256"
          },
          {
            "internalType": "uint64",
            "name": "startTime",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "endTime",
            "type": "uint64"
          },
          {
            "internalType": "uint256",
            "name": "vestingTerm",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "capacityMstrat",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "filledMstrat",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "minPurchaseBtc",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          }
        ],
        "internalType": "struct IBonding.BondSeries",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "guardian",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner_",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "btc_",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "strat_",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "treasury_",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "vestingVault_",
        "type": "address"
      }
    ],
    "name": "initialize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "liquidityBps",
    "outputs": [
      {
        "internalType": "uint16",
        "name": "",
        "type": "uint16"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "liquidityPosition",
    "outputs": [
      {
        "internalType": "contract ILiquidityPosition",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "listActiveSeries",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint8",
            "name": "id",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "priceBtcPerStrat",
            "type": "uint256"
          },
          {
            "internalType": "uint64",
            "name": "startTime",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "endTime",
            "type": "uint64"
          },
          {
            "internalType": "uint256",
            "name": "vestingTerm",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "capacityMstrat",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "filledMstrat",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "minPurchaseBtc",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          }
        ],
        "internalType": "struct IBonding.BondSeries[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "liveSeries",
    "outputs": [
      {
        "internalType": "bool",
        "name": "live",
        "type": "bool"
      },
      {
        "internalType": "uint8",
        "name": "seriesId",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "priceBtcPerStrat",
        "type": "uint256"
      }
    ],
    "name": "netBtcPerStratWad",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextSeriesId",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paused",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pendingOwner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "seriesId",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "amountIn",
        "type": "uint256"
      }
    ],
    "name": "preview",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "stratPromised",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "priceOracle",
    "outputs": [
      {
        "internalType": "contract IPriceOracle",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "proxiableUUID",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "seriesId",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "capacityMstrat",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "vestingTerm",
        "type": "uint256"
      },
      {
        "internalType": "uint64",
        "name": "endTime",
        "type": "uint64"
      }
    ],
    "name": "retuneSeries",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "wallet",
        "type": "address"
      }
    ],
    "name": "setDevWallet",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "feeVault_",
        "type": "address"
      }
    ],
    "name": "setFeeVaultOnce",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "liquidityPosition_",
        "type": "address"
      }
    ],
    "name": "setLiquidityPosition",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "priceOracle_",
        "type": "address"
      }
    ],
    "name": "setPriceOracle",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint16",
        "name": "liquidityBps_",
        "type": "uint16"
      },
      {
        "internalType": "uint16",
        "name": "devBps_",
        "type": "uint16"
      }
    ],
    "name": "setProceedsRouting",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "seriesId",
        "type": "uint8"
      },
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      }
    ],
    "name": "setSeriesActive",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "swapExecutor_",
        "type": "address"
      }
    ],
    "name": "setSwapExecutor",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint16",
        "name": "slippageBps",
        "type": "uint16"
      }
    ],
    "name": "setSwapSlippageBps",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "vvest_",
        "type": "address"
      }
    ],
    "name": "setVvestOnce",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "swapExecutor",
    "outputs": [
      {
        "internalType": "contract ISwapExecutor",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "treasuryBps",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "unpause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newImplementation",
        "type": "address"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "upgradeToAndCall",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "vvestToken",
    "outputs": [
      {
        "internalType": "contract IVVEST",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
