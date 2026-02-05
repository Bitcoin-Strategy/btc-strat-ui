/**
 * Generated from `contracts/core/PremiumSales.sol` by
 * `node scripts/sync-abi.mjs`. Do not edit: re-run the script after a contract changes.
 */
export const PREMIUM_SALES_ABI = [
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
    "name": "CapExceeded",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "DeadlinePassed",
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
    "name": "InvalidBands",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidConfig",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidInitialization",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidNAV",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidWindow",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotAuthorized",
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
    "name": "OracleNotReady",
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
    "inputs": [],
    "name": "PremiumNotPositive",
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
        "internalType": "uint256",
        "name": "btcOut",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "navFloor",
        "type": "uint256"
      }
    ],
    "name": "SaleBelowNav",
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
    "name": "SwapRouterNotSet",
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
        "components": [
          {
            "internalType": "uint16",
            "name": "premiumMinBps",
            "type": "uint16"
          },
          {
            "internalType": "uint16",
            "name": "premiumMaxBps",
            "type": "uint16"
          },
          {
            "internalType": "uint16",
            "name": "sellBpsPerWindow",
            "type": "uint16"
          }
        ],
        "indexed": false,
        "internalType": "struct IPremiumSales.Band[]",
        "name": "bands",
        "type": "tuple[]"
      }
    ],
    "name": "BandsUpdated",
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
        "name": "caller",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "stratSold",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "btcOut",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "reward",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "priceBtcPerStrat",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "navBtcPerStrat",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "premiumBps",
        "type": "uint16"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "bandIndex",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "windowStart",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "soldThisWindow",
        "type": "uint256"
      }
    ],
    "name": "PremiumSaleExecuted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "rewardBps",
        "type": "uint16"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "maxRewardBtc",
        "type": "uint256"
      }
    ],
    "name": "SaleRewardUpdated",
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
    "name": "SaleSlippageUpdated",
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
        "indexed": false,
        "internalType": "uint64",
        "name": "windowLength",
        "type": "uint64"
      }
    ],
    "name": "WindowLengthUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "windowStart",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "reserveAtWindowStart",
        "type": "uint256"
      }
    ],
    "name": "WindowSynced",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "MAX_SALE_REWARD_BPS",
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
    "name": "MAX_SALE_SLIPPAGE_BPS",
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
    "name": "MAX_SELL_BPS_PER_WINDOW",
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
    "name": "MIN_WINDOW_LENGTH",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
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
    "name": "acceptOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "bandCount",
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
    "name": "btcToken",
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
    "name": "captureFloorBps",
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
    "name": "currentPremiumBps",
    "outputs": [
      {
        "internalType": "uint16",
        "name": "premiumBps",
        "type": "uint16"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "currentWindowState",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint64",
            "name": "windowStart",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "windowLength",
            "type": "uint64"
          },
          {
            "internalType": "uint256",
            "name": "soldThisWindow",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "windowCap",
            "type": "uint256"
          },
          {
            "internalType": "uint8",
            "name": "bandIndex",
            "type": "uint8"
          },
          {
            "internalType": "uint16",
            "name": "premiumBps",
            "type": "uint16"
          }
        ],
        "internalType": "struct IPremiumSales.WindowState",
        "name": "state",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "maxStratToSell",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "amountOutMin",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "deadline",
        "type": "uint256"
      }
    ],
    "name": "executePremiumSale",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "stratSold",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "btcOut",
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
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "getBand",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint16",
            "name": "premiumMinBps",
            "type": "uint16"
          },
          {
            "internalType": "uint16",
            "name": "premiumMaxBps",
            "type": "uint16"
          },
          {
            "internalType": "uint16",
            "name": "sellBpsPerWindow",
            "type": "uint16"
          }
        ],
        "internalType": "struct IPremiumSales.Band",
        "name": "band",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getBands",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint16",
            "name": "premiumMinBps",
            "type": "uint16"
          },
          {
            "internalType": "uint16",
            "name": "premiumMaxBps",
            "type": "uint16"
          },
          {
            "internalType": "uint16",
            "name": "sellBpsPerWindow",
            "type": "uint16"
          }
        ],
        "internalType": "struct IPremiumSales.Band[]",
        "name": "",
        "type": "tuple[]"
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
        "name": "swapExecutor_",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "treasury_",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "stratToken_",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "btcToken_",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "priceOracle_",
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
    "name": "maxRewardBtc",
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
    "inputs": [],
    "name": "premiumReserveRemaining",
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
    "name": "previewSale",
    "outputs": [
      {
        "components": [
          {
            "internalType": "bool",
            "name": "eligible",
            "type": "bool"
          },
          {
            "internalType": "uint8",
            "name": "bandIndex",
            "type": "uint8"
          },
          {
            "internalType": "uint16",
            "name": "premiumBps",
            "type": "uint16"
          },
          {
            "internalType": "uint256",
            "name": "navBtcPerStrat",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "priceBtcPerStrat",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "windowCap",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "remainingInWindow",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxSellNow",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "rewardBtc",
            "type": "uint256"
          }
        ],
        "internalType": "struct IPremiumSales.SalePreview",
        "name": "preview",
        "type": "tuple"
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
    "inputs": [],
    "name": "reserveAtWindowStart",
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
    "name": "saleRewardBps",
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
    "name": "saleSlippageBps",
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
    "inputs": [
      {
        "components": [
          {
            "internalType": "uint16",
            "name": "premiumMinBps",
            "type": "uint16"
          },
          {
            "internalType": "uint16",
            "name": "premiumMaxBps",
            "type": "uint16"
          },
          {
            "internalType": "uint16",
            "name": "sellBpsPerWindow",
            "type": "uint16"
          }
        ],
        "internalType": "struct IPremiumSales.Band[]",
        "name": "bands_",
        "type": "tuple[]"
      }
    ],
    "name": "setBands",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint16",
        "name": "rewardBps",
        "type": "uint16"
      },
      {
        "internalType": "uint256",
        "name": "maxRewardBtc_",
        "type": "uint256"
      }
    ],
    "name": "setSaleReward",
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
    "name": "setSaleSlippageBps",
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
        "internalType": "uint64",
        "name": "windowLength_",
        "type": "uint64"
      }
    ],
    "name": "setWindowLength",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "soldThisWindow",
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
    "name": "stratToken",
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
    "inputs": [],
    "name": "syncWindow",
    "outputs": [
      {
        "internalType": "bool",
        "name": "rolled",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
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
    "name": "treasury",
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
    "name": "windowLength",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "windowStart",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
