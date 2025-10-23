// This is a placeholder IDL. Replace with actual DBC program IDL
// import { Idl } from '@project-serum/anchor';

export const DBC_IDL: any = {
  "version": "0.1.0",
  "name": "dynamic_bonding_curve",
  "instructions": [
    {
      "name": "initializePool",
      "accounts": [
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "creator",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "initialLiquidity",
          "type": "u64"
        },
        {
          "name": "initialPrice",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "Pool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "type": "publicKey"
          },
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "liquidity",
            "type": "u64"
          },
          {
            "name": "price",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidInitialLiquidity",
      "msg": "Initial liquidity must be greater than 0"
    },
    {
      "code": 6001,
      "name": "InvalidInitialPrice",
      "msg": "Initial price must be greater than 0"
    },
    {
      "code": 6002,
      "name": "InsufficientFunds",
      "msg": "Insufficient funds for transaction"
    }
  ]
};

export default DBC_IDL;
