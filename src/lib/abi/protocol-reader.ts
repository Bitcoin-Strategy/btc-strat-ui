/**
 * Generated from `contracts/periphery/ProtocolReader.sol` by
 * `node scripts/sync-abi.mjs`. Do not edit: re-run the script after a contract changes.
 */
export const PROTOCOL_READER_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_treasury",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_vestingVault",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_staking",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_redemption",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_strat",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_vvest",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_btc",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_bonding",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_premiumSales",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_feeVault",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_authority",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "authority",
    "outputs": [
      {
        "internalType": "contract IProtocolAuthority",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "bonding",
    "outputs": [
      {
        "internalType": "contract IBonding",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "btc",
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
    "name": "feeVault",
    "outputs": [
      {
        "internalType": "contract IFeeVault",
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
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "stratAmountForRedemption",
        "type": "uint256"
      }
    ],
    "name": "getAllUserData",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "treasuryBtc",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "navBtcPerStrat",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "stratTotalSupply",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "btcBalance",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "backingSupply",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "outstandingVvest",
            "type": "uint256"
          }
        ],
        "internalType": "struct ProtocolReader.DashboardData",
        "name": "dashboard",
        "type": "tuple"
      },
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "vestCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalVvest",
            "type": "uint256"
          }
        ],
        "internalType": "struct ProtocolReader.VestingData",
        "name": "vesting",
        "type": "tuple"
      },
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "stakedAmount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "stakeTimestamp",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "currentThf",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "thfMin",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "thfMax",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "thfMaxTime",
            "type": "uint256"
          }
        ],
        "internalType": "struct ProtocolReader.StakingData",
        "name": "stakingData",
        "type": "tuple"
      },
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "grossBtc",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "basePenaltyBtc",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "effPenaltyBtc",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "thfBonusBtc",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "netBtc",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "timeHeldFactor",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "epoch",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "remainingRcap",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "userStratBalance",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "userStakedBalance",
            "type": "uint256"
          }
        ],
        "internalType": "struct ProtocolReader.RedemptionData",
        "name": "redemptionData",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAuthorityData",
    "outputs": [
      {
        "components": [
          {
            "internalType": "enum IProtocolAuthority.Phase",
            "name": "phase",
            "type": "uint8"
          },
          {
            "internalType": "address",
            "name": "controller",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "admin",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "guardian",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "paramsTimelock",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "upgradeTimelock",
            "type": "address"
          },
          {
            "internalType": "uint64",
            "name": "genesisFinalizedAt",
            "type": "uint64"
          },
          {
            "internalType": "bool",
            "name": "daoActive",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "redemptionOpensAt",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "redemptionOpen",
            "type": "bool"
          }
        ],
        "internalType": "struct ProtocolReader.AuthorityData",
        "name": "data",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getBondingData",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint8",
            "name": "seriesCount",
            "type": "uint8"
          },
          {
            "internalType": "bool",
            "name": "live",
            "type": "bool"
          },
          {
            "internalType": "uint8",
            "name": "liveSeriesId",
            "type": "uint8"
          },
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
            "name": "series",
            "type": "tuple"
          },
          {
            "internalType": "uint256",
            "name": "remainingCapacity",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "treasuryBps",
            "type": "uint256"
          },
          {
            "internalType": "uint16",
            "name": "liquidityBps",
            "type": "uint16"
          },
          {
            "internalType": "uint16",
            "name": "devBps",
            "type": "uint16"
          },
          {
            "internalType": "uint16",
            "name": "swapSlippageBps",
            "type": "uint16"
          }
        ],
        "internalType": "struct ProtocolReader.BondingData",
        "name": "data",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getDashboard",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "treasuryBtc",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "navBtcPerStrat",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "stratTotalSupply",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "btcBalance",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "backingSupply",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "outstandingVvest",
            "type": "uint256"
          }
        ],
        "internalType": "struct ProtocolReader.DashboardData",
        "name": "data",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getFeeVaultData",
    "outputs": [
      {
        "components": [
          {
            "internalType": "bool",
            "name": "oracleReady",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "pendingStrat",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "pendingBtc",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "expectedBtc",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "reward",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "ready",
            "type": "bool"
          },
          {
            "internalType": "uint16",
            "name": "harvestRewardBps",
            "type": "uint16"
          },
          {
            "internalType": "uint256",
            "name": "maxRewardBtc",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "minHarvestBtc",
            "type": "uint256"
          },
          {
            "internalType": "uint16",
            "name": "harvestSlippageBps",
            "type": "uint16"
          }
        ],
        "internalType": "struct ProtocolReader.FeeVaultData",
        "name": "data",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPremiumSalesData",
    "outputs": [
      {
        "components": [
          {
            "internalType": "bool",
            "name": "oracleReady",
            "type": "bool"
          },
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
          },
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
            "name": "window",
            "type": "tuple"
          },
          {
            "internalType": "uint64",
            "name": "windowLength",
            "type": "uint64"
          },
          {
            "internalType": "uint256",
            "name": "reserveRemaining",
            "type": "uint256"
          },
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
            "name": "bands",
            "type": "tuple[]"
          }
        ],
        "internalType": "struct ProtocolReader.PremiumSalesData",
        "name": "data",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getProtocolState",
    "outputs": [
      {
        "components": [
          {
            "internalType": "enum IProtocolAuthority.Phase",
            "name": "phase",
            "type": "uint8"
          },
          {
            "internalType": "address",
            "name": "controller",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "admin",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "guardian",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "paramsTimelock",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "upgradeTimelock",
            "type": "address"
          },
          {
            "internalType": "uint64",
            "name": "genesisFinalizedAt",
            "type": "uint64"
          },
          {
            "internalType": "bool",
            "name": "daoActive",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "redemptionOpensAt",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "redemptionOpen",
            "type": "bool"
          }
        ],
        "internalType": "struct ProtocolReader.AuthorityData",
        "name": "authorityData",
        "type": "tuple"
      },
      {
        "components": [
          {
            "internalType": "uint8",
            "name": "seriesCount",
            "type": "uint8"
          },
          {
            "internalType": "bool",
            "name": "live",
            "type": "bool"
          },
          {
            "internalType": "uint8",
            "name": "liveSeriesId",
            "type": "uint8"
          },
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
            "name": "series",
            "type": "tuple"
          },
          {
            "internalType": "uint256",
            "name": "remainingCapacity",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "treasuryBps",
            "type": "uint256"
          },
          {
            "internalType": "uint16",
            "name": "liquidityBps",
            "type": "uint16"
          },
          {
            "internalType": "uint16",
            "name": "devBps",
            "type": "uint16"
          },
          {
            "internalType": "uint16",
            "name": "swapSlippageBps",
            "type": "uint16"
          }
        ],
        "internalType": "struct ProtocolReader.BondingData",
        "name": "bondingData",
        "type": "tuple"
      },
      {
        "components": [
          {
            "internalType": "bool",
            "name": "oracleReady",
            "type": "bool"
          },
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
          },
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
            "name": "window",
            "type": "tuple"
          },
          {
            "internalType": "uint64",
            "name": "windowLength",
            "type": "uint64"
          },
          {
            "internalType": "uint256",
            "name": "reserveRemaining",
            "type": "uint256"
          },
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
            "name": "bands",
            "type": "tuple[]"
          }
        ],
        "internalType": "struct ProtocolReader.PremiumSalesData",
        "name": "premiumSalesData",
        "type": "tuple"
      },
      {
        "components": [
          {
            "internalType": "bool",
            "name": "oracleReady",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "pendingStrat",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "pendingBtc",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "expectedBtc",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "reward",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "ready",
            "type": "bool"
          },
          {
            "internalType": "uint16",
            "name": "harvestRewardBps",
            "type": "uint16"
          },
          {
            "internalType": "uint256",
            "name": "maxRewardBtc",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "minHarvestBtc",
            "type": "uint256"
          },
          {
            "internalType": "uint16",
            "name": "harvestSlippageBps",
            "type": "uint16"
          }
        ],
        "internalType": "struct ProtocolReader.FeeVaultData",
        "name": "feeVaultData",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "stratAmount",
        "type": "uint256"
      }
    ],
    "name": "getRedemptionData",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "grossBtc",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "basePenaltyBtc",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "effPenaltyBtc",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "thfBonusBtc",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "netBtc",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "timeHeldFactor",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "epoch",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "remainingRcap",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "userStratBalance",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "userStakedBalance",
            "type": "uint256"
          }
        ],
        "internalType": "struct ProtocolReader.RedemptionData",
        "name": "data",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getStakingData",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "stakedAmount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "stakeTimestamp",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "currentThf",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "thfMin",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "thfMax",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "thfMaxTime",
            "type": "uint256"
          }
        ],
        "internalType": "struct ProtocolReader.StakingData",
        "name": "data",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getVestingData",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "vestCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalVvest",
            "type": "uint256"
          }
        ],
        "internalType": "struct ProtocolReader.VestingData",
        "name": "data",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "offset",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "getVestingOverview",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "totalVvest",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "vestCount",
            "type": "uint256"
          },
          {
            "components": [
              {
                "internalType": "uint256",
                "name": "amountStrat",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "claimedStrat",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "claimable",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "start",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "end",
                "type": "uint256"
              },
              {
                "internalType": "uint8",
                "name": "seriesId",
                "type": "uint8"
              }
            ],
            "internalType": "struct ProtocolReader.VestSchedule[]",
            "name": "schedules",
            "type": "tuple[]"
          }
        ],
        "internalType": "struct ProtocolReader.VestingOverview",
        "name": "data",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "premiumSales",
    "outputs": [
      {
        "internalType": "contract IPremiumSales",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "redemption",
    "outputs": [
      {
        "internalType": "contract IRedemption",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "staking",
    "outputs": [
      {
        "internalType": "contract IStaking",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "strat",
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
    "name": "treasury",
    "outputs": [
      {
        "internalType": "contract ITreasury",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "vestingVault",
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
    "name": "vvest",
    "outputs": [
      {
        "internalType": "contract IERC20",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
