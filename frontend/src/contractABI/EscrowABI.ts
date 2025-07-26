// contractABI/EscrowContract.ts
// Complete structure to match the useEscrowContract hook functionality

export const ESCROW_CONTRACT_ABI = {
    source: {
        hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
        language: "ink! 4.0.0",
        compiler: "rustc 1.68.0",
        build_info: {}
    },
    contract: {
        name: "escrow_contract",
        version: "1.0.0",
        authors: ["Your Name"]
    },
    spec: {
        constructors: [
            {
                args: [],
                default: false,
                docs: ["Constructor for the escrow contract"],
                label: "new",
                mutates: false,
                payable: false,
                returnType: {
                    displayName: ["ink_primitives", "ConstructorResult"],
                    type: 0
                },
                selector: "0x9bae9d5e"
            }
        ],
        docs: [],
        environment: {
            accountId: {
                displayName: ["AccountId"],
                type: 1
            },
            balance: {
                displayName: ["Balance"],
                type: 3
            },
            blockNumber: {
                displayName: ["BlockNumber"],
                type: 12
            },
            chainExtension: {
                displayName: ["ChainExtension"],
                type: 13
            },
            hash: {
                displayName: ["Hash"],
                type: 14
            },
            maxEventTopics: 4,
            timestamp: {
                displayName: ["Timestamp"],
                type: 11
            }
        },
        events: [
            {
                args: [
                    {
                        docs: [],
                        indexed: true,
                        label: "escrow_id",
                        type: {
                            displayName: ["String"],
                            type: 4
                        }
                    },
                    {
                        docs: [],
                        indexed: true,
                        label: "creator",
                        type: {
                            displayName: ["AccountId"],
                            type: 1
                        }
                    },
                    {
                        docs: [],
                        indexed: false,
                        label: "counterparty",
                        type: {
                            displayName: ["AccountId"],
                            type: 1
                        }
                    },
                    {
                        docs: [],
                        indexed: false,
                        label: "counterparty_type",
                        type: {
                            displayName: ["String"],
                            type: 4
                        }
                    },
                    {
                        docs: [],
                        indexed: false,
                        label: "title",
                        type: {
                            displayName: ["String"],
                            type: 4
                        }
                    },
                    {
                        docs: [],
                        indexed: false,
                        label: "total_amount",
                        type: {
                            displayName: ["String"],
                            type: 4
                        }
                    },
                    {
                        docs: [],
                        indexed: false,
                        label: "transaction_hash",
                        type: {
                            displayName: ["Option"],
                            type: 19
                        }
                    }
                ],
                docs: ["Event emitted when a new escrow is created"],
                label: "EscrowCreated"
            },
            {
                args: [
                    {
                        docs: [],
                        indexed: true,
                        label: "escrow_id",
                        type: {
                            displayName: ["String"],
                            type: 4
                        }
                    },
                    {
                        docs: [],
                        indexed: false,
                        label: "old_status",
                        type: {
                            displayName: ["EscrowStatus"],
                            type: 5
                        }
                    },
                    {
                        docs: [],
                        indexed: false,
                        label: "new_status",
                        type: {
                            displayName: ["EscrowStatus"],
                            type: 5
                        }
                    },
                    {
                        docs: [],
                        indexed: false,
                        label: "transaction_hash",
                        type: {
                            displayName: ["Option"],
                            type: 19
                        }
                    }
                ],
                docs: ["Event emitted when escrow status changes"],
                label: "EscrowStatusChanged"
            },
            {
                args: [
                    {
                        docs: [],
                        indexed: true,
                        label: "escrow_id",
                        type: {
                            displayName: ["String"],
                            type: 4
                        }
                    },
                    {
                        docs: [],
                        indexed: true,
                        label: "milestone_id",
                        type: {
                            displayName: ["String"],
                            type: 4
                        }
                    },
                    {
                        docs: [],
                        indexed: false,
                        label: "old_status",
                        type: {
                            displayName: ["MilestoneStatus"],
                            type: 10
                        }
                    },
                    {
                        docs: [],
                        indexed: false,
                        label: "new_status",
                        type: {
                            displayName: ["MilestoneStatus"],
                            type: 10
                        }
                    }
                ],
                docs: ["Event emitted when milestone status changes"],
                label: "MilestoneStatusChanged"
            },
            {
                args: [
                    {
                        docs: [],
                        indexed: true,
                        label: "escrow_id",
                        type: {
                            displayName: ["String"],
                            type: 4
                        }
                    },
                    {
                        docs: [],
                        indexed: true,
                        label: "milestone_id",
                        type: {
                            displayName: ["String"],
                            type: 4
                        }
                    },
                    {
                        docs: [],
                        indexed: false,
                        label: "receiver_address",
                        type: {
                            displayName: ["AccountId"],
                            type: 1
                        }
                    },
                    {
                        docs: [],
                        indexed: false,
                        label: "payer_address",
                        type: {
                            displayName: ["AccountId"],
                            type: 1
                        }
                    },
                    {
                        docs: [],
                        indexed: false,
                        label: "transaction_hash",
                        type: {
                            displayName: ["String"],
                            type: 4
                        }
                    }
                ],
                docs: ["Event emitted when milestone funds are released"],
                label: "MilestoneReleased"
            },
            {
                args: [
                    {
                        docs: [],
                        indexed: true,
                        label: "escrow_id",
                        type: {
                            displayName: ["String"],
                            type: 4
                        }
                    },
                    {
                        docs: [],
                        indexed: true,
                        label: "milestone_id",
                        type: {
                            displayName: ["String"],
                            type: 4
                        }
                    },
                    {
                        docs: [],
                        indexed: false,
                        label: "filed_by",
                        type: {
                            displayName: ["AccountId"],
                            type: 1
                        }
                    },
                    {
                        docs: [],
                        indexed: false,
                        label: "reason",
                        type: {
                            displayName: ["String"],
                            type: 4
                        }
                    },
                    {
                        docs: [],
                        indexed: false,
                        label: "dispute_id",
                        type: {
                            displayName: ["String"],
                            type: 4
                        }
                    }
                ],
                docs: ["Event emitted when a milestone is disputed"],
                label: "MilestoneDisputed"
            },
            {
                args: [
                    {
                        docs: [],
                        indexed: true,
                        label: "escrow_id",
                        type: {
                            displayName: ["String"],
                            type: 4
                        }
                    },
                    {
                        docs: [],
                        indexed: false,
                        label: "notification_type",
                        type: {
                            displayName: ["String"],
                            type: 4
                        }
                    },
                    {
                        docs: [],
                        indexed: false,
                        label: "sender_address",
                        type: {
                            displayName: ["AccountId"],
                            type: 1
                        }
                    },
                    {
                        docs: [],
                        indexed: false,
                        label: "recipient_address",
                        type: {
                            displayName: ["AccountId"],
                            type: 1
                        }
                    },
                    {
                        docs: [],
                        indexed: false,
                        label: "notification_id",
                        type: {
                            displayName: ["String"],
                            type: 4
                        }
                    }
                ],
                docs: ["Event emitted when counterparty is notified"],
                label: "CounterpartyNotified"
            }
        ],
        lang_error: {
            displayName: ["ink", "LangError"],
            type: 2
        },
        messages: [
            {
                args: [
                    {
                        label: "user_address",
                        type: {
                            displayName: ["AccountId"],
                            type: 1
                        }
                    },
                    {
                        label: "counterparty_address",
                        type: {
                            displayName: ["AccountId"],
                            type: 1
                        }
                    },
                    {
                        label: "counterparty_type",
                        type: {
                            displayName: ["String"],
                            type: 4
                        }
                    },
                    {
                        label: "status",
                        type: {
                            displayName: ["String"],
                            type: 4
                        }
                    },
                    {
                        label: "title",
                        type: {
                            displayName: ["String"],
                            type: 4
                        }
                    },
                    {
                        label: "description",
                        type: {
                            displayName: ["String"],
                            type: 4
                        }
                    },
                    {
                        label: "total_amount",
                        type: {
                            displayName: ["String"],
                            type: 4
                        }
                    },
                    {
                        label: "milestones",
                        type: {
                            displayName: ["Vec"],
                            type: 6
                        }
                    },
                    {
                        label: "transaction_hash",
                        type: {
                            displayName: ["Option"],
                            type: 19
                        }
                    }
                ],
                default: false,
                docs: ["Create a new escrow"],
                label: "create_escrow",
                mutates: true,
                payable: false,
                returnType: {
                    displayName: ["ink", "MessageResult"],
                    type: 7
                },
                selector: "0x12345678"
            },
            {
                args: [
                    {
                        label: "escrow_id",
                        type: {
                            displayName: ["String"],
                            type: 4
                        }
                    }
                ],
                default: false,
                docs: ["Get escrow details by ID"],
                label: "get_escrow",
                mutates: false,
                payable: false,
                returnType: {
                    displayName: ["ink", "MessageResult"],
                    type: 8
                },
                selector: "0x87654321"
            },
            {
                args: [
                    {
                        label: "milestone_id",
                        type: {
                            displayName: ["String"],
                            type: 4
                        }
                    }
                ],
                default: false,
                docs: ["Get milestone details by ID"],
                label: "get_escrow_milestone",
                mutates: false,
                payable: false,
                returnType: {
                    displayName: ["ink", "MessageResult"],
                    type: 20
                },
                selector: "0x11223344"
            },
            {
                args: [
                    {
                        label: "escrow_id",
                        type: {
                            displayName: ["String"],
                            type: 4
                        }
                    },
                    {
                        label: "new_status",
                        type: {
                            displayName: ["String"],
                            type: 4
                        }
                    },
                    {
                        label: "transaction_hash",
                        type: {
                            displayName: ["Option"],
                            type: 19
                        }
                    }
                ],
                default: false,
                docs: ["Update escrow status"],
                label: "update_escrow_status",
                mutates: true,
                payable: false,
                returnType: {
                    displayName: ["ink", "MessageResult"],
                    type: 8
                },
                selector: "0x55667788"
            },
            {
                args: [
                    {
                        label: "escrow_id",
                        type: {
                            displayName: ["String"],
                            type: 4
                        }
                    },
                    {
                        label: "milestone",
                        type: {
                            displayName: ["Milestone"],
                            type: 9
                        }
                    },
                    {
                        label: "new_status",
                        type: {
                            displayName: ["String"],
                            type: 4
                        }
                    }
                ],
                default: false,
                docs: ["Update milestone status"],
                label: "update_escrow_milestone_status",
                mutates: true,
                payable: false,
                returnType: {
                    displayName: ["ink", "MessageResult"],
                    type: 8
                },
                selector: "0x99aabbcc"
            },
            {
                args: [],
                default: false,
                docs: ["List all escrows for the current account"],
                label: "list_escrows",
                mutates: false,
                payable: false,
                returnType: {
                    displayName: ["ink", "MessageResult"],
                    type: 21
                },
                selector: "0xddee1122"
            },
            {
                args: [
                    {
                        label: "escrow_id",
                        type: {
                            displayName: ["String"],
                            type: 4
                        }
                    },
                    {
                        label: "milestone_id",
                        type: {
                            displayName: ["String"],
                            type: 4
                        }
                    }
                ],
                default: false,
                docs: ["Release funds for a milestone"],
                label: "release_milestone",
                mutates: true,
                payable: false,
                returnType: {
                    displayName: ["ink", "MessageResult"],
                    type: 22
                },
                selector: "0x33445566"
            },
            {
                args: [
                    {
                        label: "escrow_id",
                        type: {
                            displayName: ["String"],
                            type: 4
                        }
                    },
                    {
                        label: "milestone_id",
                        type: {
                            displayName: ["String"],
                            type: 4
                        }
                    },
                    {
                        label: "reason",
                        type: {
                            displayName: ["String"],
                            type: 4
                        }
                    }
                ],
                default: false,
                docs: ["Dispute a milestone"],
                label: "dispute_milestone",
                mutates: true,
                payable: false,
                returnType: {
                    displayName: ["ink", "MessageResult"],
                    type: 23
                },
                selector: "0x77889900"
            },
            {
                args: [
                    {
                        label: "escrow_id",
                        type: {
                            displayName: ["String"],
                            type: 4
                        }
                    },
                    {
                        label: "notification_type",
                        type: {
                            displayName: ["String"],
                            type: 4
                        }
                    },
                    {
                        label: "recipient_address",
                        type: {
                            displayName: ["AccountId"],
                            type: 1
                        }
                    },
                    {
                        label: "message",
                        type: {
                            displayName: ["Option"],
                            type: 19
                        }
                    },
                    {
                        label: "notification_kind",
                        type: {
                            displayName: ["Option"],
                            type: 19
                        }
                    }
                ],
                default: false,
                docs: ["Notify counterparty about escrow"],
                label: "notify_counterparty",
                mutates: true,
                payable: false,
                returnType: {
                    displayName: ["ink", "MessageResult"],
                    type: 24
                },
                selector: "0xaabbccdd"
            },
            {
                args: [
                    {
                        label: "transaction_hash",
                        type: {
                            displayName: ["String"],
                            type: 4
                        }
                    }
                ],
                default: false,
                docs: ["Check transaction status"],
                label: "check_transaction_status",
                mutates: false,
                payable: false,
                returnType: {
                    displayName: ["ink", "MessageResult"],
                    type: 25
                },
                selector: "0xeeee1111"
            }
        ]
    },
    storage: {
        root: {
            layout: {
                struct: {
                    fields: [
                        {
                            layout: {
                                leaf: {
                                    key: "0x00000000",
                                    ty: 26
                                }
                            },
                            name: "escrows"
                        },
                        {
                            layout: {
                                leaf: {
                                    key: "0x00000001",
                                    ty: 27
                                }
                            },
                            name: "next_escrow_id"
                        }
                    ],
                    name: "EscrowContract"
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
                    variant: {
                        variants: [
                            {
                                fields: [
                                    {
                                        type: 1
                                    }
                                ],
                                index: 0,
                                name: "Ok"
                            },
                            {
                                fields: [
                                    {
                                        type: 2
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
                        type: 1
                    },
                    {
                        name: "E",
                        type: 2
                    }
                ],
                path: ["Result"]
            }
        },
        {
            id: 1,
            type: {
                def: {
                    composite: {
                        fields: [
                            {
                                type: 15,
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
                    variant: {
                        variants: [
                            {
                                fields: [
                                    {
                                        type: 16
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
            id: 3,
            type: {
                def: {
                    primitive: "u128"
                }
            }
        },
        {
            id: 4,
            type: {
                def: {
                    primitive: "str"
                }
            }
        },
        {
            id: 5,
            type: {
                def: {
                    variant: {
                        variants: [
                            {
                                index: 0,
                                name: "Active"
                            },
                            {
                                index: 1,
                                name: "Completed"
                            },
                            {
                                index: 2,
                                name: "Disputed"
                            },
                            {
                                index: 3,
                                name: "Cancelled"
                            },
                            {
                                index: 4,
                                name: "Inactive"
                            },
                            {
                                index: 5,
                                name: "Pending"
                            },
                            {
                                index: 6,
                                name: "Rejected"
                            }
                        ]
                    }
                },
                path: ["EscrowStatus"]
            }
        },
        {
            id: 6,
            type: {
                def: {
                    sequence: {
                        type: 9
                    }
                }
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
                                        type: 4
                                    }
                                ],
                                index: 0,
                                name: "Ok"
                            },
                            {
                                fields: [
                                    {
                                        type: 2
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
                        type: 4
                    },
                    {
                        name: "E",
                        type: 2
                    }
                ],
                path: ["Result"]
            }
        },
        {
            id: 8,
            type: {
                def: {
                    variant: {
                        variants: [
                            {
                                fields: [
                                    {
                                        type: 17
                                    }
                                ],
                                index: 0,
                                name: "Ok"
                            },
                            {
                                fields: [
                                    {
                                        type: 2
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
                        type: 17
                    },
                    {
                        name: "E",
                        type: 2
                    }
                ],
                path: ["Result"]
            }
        },
        {
            id: 9,
            type: {
                def: {
                    composite: {
                        fields: [
                            {
                                name: "id",
                                type: 4,
                                typeName: "String"
                            },
                            {
                                name: "description",
                                type: 4,
                                typeName: "String"
                            },
                            {
                                name: "amount",
                                type: 4,
                                typeName: "String"
                            },
                            {
                                name: "status",
                                type: 4,
                                typeName: "String"
                            },
                            {
                                name: "deadline",
                                type: 11,
                                typeName: "u64"
                            }
                        ]
                    }
                },
                path: ["Milestone"]
            }
        },
        {
            id: 10,
            type: {
                def: {
                    variant: {
                        variants: [
                            {
                                index: 0,
                                name: "Pending"
                            },
                            {
                                index: 1,
                                name: "InProgress"
                            },
                            {
                                index: 2,
                                name: "Completed"
                            },
                            {
                                index: 3,
                                name: "Disputed"
                            },
                            {
                                index: 4,
                                name: "Overdue"
                            }
                        ]
                    }
                },
                path: ["MilestoneStatus"]
            }
        },
        {
            id: 11,
            type: {
                def: {
                    primitive: "u64"
                }
            }
        },
        {
            id: 12,
            type: {
                def: {
                    primitive: "u32"
                }
            }
        },
        {
            id: 13,
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
            id: 14,
            type: {
                def: {
                    composite: {
                        fields: [
                            {
                                type: 15,
                                typeName: "[u8; 32]"
                            }
                        ]
                    }
                },
                path: ["ink_primitives", "types", "Hash"]
            }
        },
        {
            id: 15,
            type: {
                def: {
                    array: {
                        len: 32,
                        type: 18
                    }
                }
            }
        },
        {
            id: 16,
            type: {
                def: {
                    tuple: []
                }
            }
        },
        {
            id: 17,
            type: {
                def: {
                    composite: {
                        fields: [
                            {
                                name: "id",
                                type: 4,
                                typeName: "String"
                            },
                            {
                                name: "creator",
                                type: 4,
                                typeName: "String"
                            },
                            {
                                name: "worker",
                                type: 4,
                                typeName: "String"
                            },
                            {
                                name: "client",
                                type: 4,
                                typeName: "String"
                            },
                            {
                                name: "counterparty_address",
                                type: 4,
                                typeName: "String"
                            },
                            {
                                name: "counterparty_type",
                                type: 4,
                                typeName: "String"
                            },
                            {
                                name: "title",
                                type: 4,
                                typeName: "String"
                            },
                            {
                                name: "description",
                                type: 4,
                                typeName: "String"
                            },
                            {
                                name: "total_amount",
                                type: 4,
                                typeName: "String"
                            },
                            {
                                name: "status",
                                type: 4,
                                typeName: "String"
                            },
                            {
                                name: "created_at",
                                type: 11,
                                typeName: "u64"
                            },
                            {
                                name: "milestones",
                                type: 6,
                                typeName: "Vec<Milestone>"
                            }
                        ]
                    }
                },
                path: ["EscrowData"]
            }
        },
        {
            id: 18,
            type: {
                def: {
                    primitive: "u8"
                }
            }
        },
        {
            id: 19,
            type: {
                def: {
                    variant: {
                        variants: [
                            {
                                index: 0,
                                name: "None"
                            },
                            {
                                fields: [
                                    {
                                        type: 4
                                    }
                                ],
                                index: 1,
                                name: "Some"
                            }
                        ]
                    }
                },
                params: [
                    {
                        name: "T",
                        type: 4
                    }
                ],
                path: ["Option"]
            }
        },
        {
            id: 20,
            type: {
                def: {
                    variant: {
                        variants: [
                            {
                                fields: [
                                    {
                                        type: 9
                                    }
                                ],
                                index: 0,
                                name: "Ok"
                            },
                            {
                                fields: [
                                    {
                                        type: 2
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
                        type: 9
                    },
                    {
                        name: "E",
                        type: 2
                    }
                ],
                path: ["Result"]
            }
        },
        {
            id: 21,
            type: {
                def: {
                    variant: {
                        variants: [
                            {
                                fields: [
                                    {
                                        type: 28
                                    }
                                ],
                                index: 0,
                                name: "Ok"
                            },
                            {
                                fields: [
                                    {
                                        type: 2
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
                        type: 28
                    },
                    {
                        name: "E",
                        type: 2
                    }
                ],
                path: ["Result"]
            }
        },
        {
            id: 22,
            type: {
                def: {
                    variant: {
                        variants: [
                            {
                                fields: [
                                    {
                                        type: 29
                                    }
                                ],
                                index: 0,
                                name: "Ok"
                            },
                            {
                                fields: [
                                    {
                                        type: 2
                                    }
                                ],
                                index:1,
                                name: "Err"
                            }
                        ]
                    }
                },
                params: [
                    {
                        name: "T",
                        type: 29
                    },
                    {
                        name: "E",
                        type: 2
                    }
                ],
                path: ["Result"]
            }
        },
        {
            id: 23,
            type: {
                def: {
                    variant: {
                        variants: [
                            {
                                fields: [
                                    {
                                        type: 30
                                    }
                                ],
                                index: 0,
                                name: "Ok"
                            },
                            {
                                fields: [
                                    {
                                        type: 2
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
                        type: 30
                    },
                    {
                        name: "E",
                        type: 2
                    }
                ],
                path: ["Result"]
            }
        },
        {
            id: 24,
            type: {
                def: {
                    variant: {
                        variants: [
                            {
                                fields: [
                                    {
                                        type: 31
                                    }
                                ],
                                index: 0,
                                name: "Ok"
                            },
                            {
                                fields: [
                                    {
                                        type: 2
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
                        type: 31
                    },
                    {
                        name: "E",
                        type: 2
                    }
                ],
                path: ["Result"]
            }
        },
        {
            id: 25,
            type: {
                def: {
                    variant: {
                        variants: [
                            {
                                fields: [
                                    {
                                        type: 32
                                    }
                                ],
                                index: 0,
                                name: "Ok"
                            },
                            {
                                fields: [
                                    {
                                        type: 2
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
                        type: 32
                    },
                    {
                        name: "E",
                        type: 2
                    }
                ],
                path: ["Result"]
            }
        },
        {
            id: 26,
            type: {
                def: {
                    composite: {
                        fields: [
                            {
                                type: 33,
                                typeName: "BTreeMap<String, EscrowData>"
                            }
                        ]
                    }
                },
                path: ["BTreeMap"]
            }
        },
        {
            id: 27,
            type: {
                def: {
                    primitive: "u32"
                }
            }
        },
        {
            id: 28,
            type: {
                def: {
                    sequence: {
                        type: 17
                    }
                }
            }
        },
        {
            id: 29,
            type: {
                def: {
                    composite: {
                        fields: [
                            {
                                name: "milestone_id",
                                type: 4,
                                typeName: "String"
                            },
                            {
                                name: "transaction_hash",
                                type: 4,
                                typeName: "String"
                            },
                            {
                                name: "amount_released",
                                type: 4,
                                typeName: "String"
                            },
                            {
                                name: "receiver_address",
                                type: 1,
                                typeName: "AccountId"
                            },
                            {
                                name: "released_at",
                                type: 11,
                                typeName: "u64"
                            }
                        ]
                    }
                },
                path: ["MilestoneReleaseResult"]
            }
        },
        {
            id: 30,
            type: {
                def: {
                    composite: {
                        fields: [
                            {
                                name: "dispute_id",
                                type: 4,
                                typeName: "String"
                            },
                            {
                                name: "milestone_id",
                                type: 4,
                                typeName: "String"
                            },
                            {
                                name: "filed_by",
                                type: 1,
                                typeName: "AccountId"
                            },
                            {
                                name: "reason",
                                type: 4,
                                typeName: "String"
                            },
                            {
                                name: "created_at",
                                type: 11,
                                typeName: "u64"
                            }
                        ]
                    }
                },
                path: ["DisputeResult"]
            }
        },
        {
            id: 31,
            type: {
                def: {
                    composite: {
                        fields: [
                            {
                                name: "notification_id",
                                type: 4,
                                typeName: "String"
                            },
                            {
                                name: "notification_type",
                                type: 4,
                                typeName: "String"
                            },
                            {
                                name: "recipient_address",
                                type: 1,
                                typeName: "AccountId"
                            },
                            {
                                name: "message",
                                type: 19,
                                typeName: "Option<String>"
                            },
                            {
                                name: "sent_at",
                                type: 11,
                                typeName: "u64"
                            }
                        ]
                    }
                },
                path: ["NotificationResult"]
            }
        },
        {
            id: 32,
            type: {
                def: {
                    composite: {
                        fields: [
                            {
                                name: "transaction_hash",
                                type: 4,
                                typeName: "String"
                            },
                            {
                                name: "status",
                                type: 4,
                                typeName: "String"
                            },
                            {
                                name: "block_number",
                                type: 19,
                                typeName: "Option<String>"
                            },
                            {
                                name: "confirmations",
                                type: 12,
                                typeName: "u32"
                            },
                            {
                                name: "gas_used",
                                type: 19,
                                typeName: "Option<String>"
                            }
                        ]
                    }
                },
                path: ["TransactionStatus"]
            }
        },
        {
            id: 33,
            type: {
                def: {
                    composite: {
                        fields: [
                            {
                                type: 34,
                                typeName: "BTreeMap<String, EscrowData>"
                            }
                        ]
                    }
                },
                path: ["BTreeMap"]
            }
        },
        {
            id: 34,
            type: {
                def: {
                    composite: {
                        fields: [
                            {
                                name: "key",
                                type: 4,
                                typeName: "String"
                            },
                            {
                                name: "value",
                                type: 17,
                                typeName: "EscrowData"
                            }
                        ]
                    }
                },
                path: ["BTreeMapEntry"]
            }
        }
    ],
    version: "4"
} as const;

// Type definitions for better TypeScript support
export interface EscrowData {
    id: string;
    creator: string;
    worker: string;
    client: string;
    counterparty_address: string;
    counterparty_type: string;
    title: string;
    description: string;
    total_amount: string;
    status: string;
    created_at: number;
    milestones: Milestone[];
}

export interface Milestone {
    id: string;
    description: string;
    amount: string;
    status: string;
    deadline: number;
}

export interface MilestoneReleaseResult {
    milestone_id: string;
    transaction_hash: string;
    amount_released: string;
    receiver_address: string;
    released_at: number;
}

export interface DisputeResult {
    dispute_id: string;
    milestone_id: string;
    filed_by: string;
    reason: string;
    created_at: number;
}

export interface NotificationResult {
    notification_id: string;
    notification_type: string;
    recipient_address: string;
    message?: string;
    sent_at: number;
}

export interface TransactionStatus {
    transaction_hash: string;
    status: string;
    block_number?: string;
    confirmations: number;
    gas_used?: string;
}

export enum EscrowStatus {
    Active = "Active",
    Completed = "Completed",
    Disputed = "Disputed",
    Cancelled = "Cancelled",
    Inactive = "Inactive",
    Pending = "Pending",
    Rejected = "Rejected"
}

export enum MilestoneStatus {
    Pending = "Pending",
    InProgress = "InProgress",
    Completed = "Completed",
    Disputed = "Disputed",
    Overdue = "Overdue"
}