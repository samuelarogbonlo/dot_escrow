// contractABI/PSP22Metadata.ts
// This is the structure you need instead of just the ABI

export const PSP22_ABI = {
   source: {
    hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    language: "ink! 4.0.0",
    compiler: "rustc 1.70.0",
    build_info: {}
  },
  contract: {
    name: "psp22_token",
    version: "1.0.0",
    authors: ["Unknown"]
  },
  spec: {
    constructors: [],
    docs: [],
    environment: {
      accountId: {
        displayName: ["AccountId"],
        type: 1
      },
      balance: {
        displayName: ["Balance"],
        type: 0
      },
      blockNumber: {
        displayName: ["BlockNumber"],
        type: 2
      },
      chainExtension: {
        displayName: ["ChainExtension"],
        type: 3
      },
      hash: {
        displayName: ["Hash"],
        type: 4
      },
      maxEventTopics: 4,
      timestamp: {
        displayName: ["Timestamp"],
        type: 5
      }
    },
    events: [],
    lang_error: {
      displayName: ["ink", "LangError"],
      type: 6
    },
    messages: [
      {
        args: [],
        default: false,
        docs: ["Returns the total token supply."],
        label: "PSP22::total_supply",
        mutates: false,
        payable: false,
        returnType: {
          displayName: ["ink", "MessageResult"],
          type: 7
        },
        selector: "0x162df8c2"
      },
      {
        args: [
          {
            label: "owner",
            type: {
              displayName: ["AccountId"],
              type: 1
            }
          }
        ],
        default: false,
        docs: ["Returns the account balance for the specified `owner`."],
        label: "PSP22::balance_of",
        mutates: false,
        payable: false,
        returnType: {
          displayName: ["ink", "MessageResult"],
          type: 7
        },
        selector: "0x6568382f"
      },
      {
        args: [
          {
            label: "owner",
            type: {
              displayName: ["AccountId"],
              type: 1
            }
          },
          {
            label: "spender",
            type: {
              displayName: ["AccountId"],
              type: 1
            }
          }
        ],
        default: false,
        docs: ["Returns the amount which `spender` is still allowed to withdraw from `owner`."],
        label: "PSP22::allowance",
        mutates: false,
        payable: false,
        returnType: {
          displayName: ["ink", "MessageResult"],
          type: 7
        },
        selector: "0x4d47d921"
      },
      {
        args: [
          {
            label: "to",
            type: {
              displayName: ["AccountId"],
              type: 1
            }
          },
          {
            label: "value",
            type: {
              displayName: ["Balance"],
              type: 0
            }
          },
          {
            label: "data",
            type: {
              displayName: ["Vec"],
              type: 8
            }
          }
        ],
        default: false,
        docs: ["Transfers `value` amount of tokens from the caller's account to account `to`."],
        label: "PSP22::transfer",
        mutates: true,
        payable: false,
        returnType: {
          displayName: ["ink", "MessageResult"],
          type: 9
        },
        selector: "0xdb20f9f5"
      },
      {
        args: [
          {
            label: "spender",
            type: {
              displayName: ["AccountId"],
              type: 1
            }
          },
          {
            label: "value",
            type: {
              displayName: ["Balance"],
              type: 0
            }
          }
        ],
        default: false,
        docs: ["Allows `spender` to withdraw from the caller's account multiple times, up to the `value` amount."],
        label: "PSP22::approve",
        mutates: true,
        payable: false,
        returnType: {
          displayName: ["ink", "MessageResult"],
          type: 9
        },
        selector: "0xb20f1bbd"
      }
    ]
  },
  storage: {
    root: {
      layout: {
        struct: {
          fields: [],
          name: "Contract"
        }
      },
      root_key: "0x00000000"
    }
  },
  types: [
    {
      id: 0,
      type: {
        def: {
          primitive: "u128"
        }
      }
    },
    {
      id: 1,
      type: {
        def: {
          composite: {
            fields: [
              {
                type: 10,
                typeName: "[u8; 32]"
              }
            ]
          }
        },
        path: ["ink_primitives", "types", "AccountId"]
      }
    },
    {
      id: 2,
      type: {
        def: {
          primitive: "u32"
        }
      }
    },
    {
      id: 3,
      type: {
        def: {
          variant: {
            variants: []
          }
        },
        path: ["ink_env", "types", "NoChainExtension"]
      }
    },
    {
      id: 4,
      type: {
        def: {
          composite: {
            fields: [
              {
                type: 10,
                typeName: "[u8; 32]"
              }
            ]
          }
        },
        path: ["ink_primitives", "types", "Hash"]
      }
    },
    {
      id: 5,
      type: {
        def: {
          primitive: "u64"
        }
      }
    },
    {
      id: 6,
      type: {
        def: {
          variant: {
            variants: [
              {
                fields: [
                  {
                    type: 11
                  }
                ],
                index: 0,
                name: "CouldNotReadInput"
              }
            ]
          }
        },
        path: ["ink_primitives", "LangError"]
      }
    },
    {
      id: 7,
      type: {
        def: {
          variant: {
            variants: [
              {
                fields: [
                  {
                    type: 0
                  }
                ],
                index: 0,
                name: "Ok"
              },
              {
                fields: [
                  {
                    type: 6
                  }
                ],
                index: 1,
                name: "Err"
              }
            ]
          }
        },
        params: [
          {
            name: "T",
            type: 0
          },
          {
            name: "E",
            type: 6
          }
        ],
        path: ["Result"]
      }
    },
    {
      id: 8,
      type: {
        def: {
          sequence: {
            type: 12
          }
        }
      }
    },
    {
      id: 9,
      type: {
        def: {
          variant: {
            variants: [
              {
                fields: [
                  {
                    type: 13
                  }
                ],
                index: 0,
                name: "Ok"
              },
              {
                fields: [
                  {
                    type: 6
                  }
                ],
                index: 1,
                name: "Err"
              }
            ]
          }
        },
        params: [
          {
            name: "T",
            type: 13
          },
          {
            name: "E",
            type: 6
          }
        ],
        path: ["Result"]
      }
    },
    {
      id: 10,
      type: {
        def: {
          array: {
            len: 32,
            type: 12
          }
        }
      }
    },
    {
      id: 11,
      type: {
        def: {
          tuple: []
        }
      }
    },
    {
      id: 12,
      type: {
        def: {
          primitive: "u8"
        }
      }
    },
    {
      id: 13,
      type: {
        def: {
          tuple: []
        }
      }
    }
  ],
  version: "4"
};