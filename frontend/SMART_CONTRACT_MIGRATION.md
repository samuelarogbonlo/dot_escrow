# Smart Contract Migration Guide

## Overview

This document describes the migration from axios API calls to smart contract interactions in the `useEscrowContract` hook.

## What Changed

### Before (Axios API Calls)
- All escrow operations were handled by a backend API at `http://localhost:3006`
- Data was stored in a centralized database
- Operations were fast but required backend infrastructure

### After (Smart Contract Calls)
- All escrow operations are now handled by the blockchain smart contract
- Data is stored on-chain for transparency and immutability
- Operations require blockchain confirmations but are truly decentralized

## Smart Contract Address

```
5FjtTZsj8L9Yax5wjJz1V92muvThYrqVb8dpuoBWXo9G6who
```

## Functions Migrated

| Function | Old Implementation | New Implementation |
|----------|-------------------|-------------------|
| `createEscrow` | `axios.post()` | `createEscrowContract()` |
| `getEscrow` | `axios.get()` | `getEscrowContract()` |
| `listEscrows` | `axios.get()` | `listEscrowsContract()` |
| `updateEscrowStatus` | `axios.patch()` | `updateEscrowStatusContract()` |
| `updateEscrowMilestoneStatus` | `axios.patch()` | `updateMilestoneStatusContract()` |
| `releaseMilestone` | Mock response | `releaseMilestoneContract()` |
| `disputeMilestone` | `axios.put()` | `disputeMilestoneContract()` |
| `notifyCounterparty` | `axios.post()` | `notifyCounterpartyContract()` |

## New Files Created

### `frontend/src/utils/escrowContractUtils.ts`
Contains all the smart contract interaction functions that replace the axios calls.

### Updated `frontend/src/contractABI/EscrowABI.ts`
Now includes the deployed contract address as a constant.

## Benefits of Migration

1. **True Decentralization**: No dependency on centralized backend
2. **Transparency**: All operations are publicly verifiable on the blockchain
3. **Immutability**: Data cannot be tampered with once recorded
4. **Security**: Smart contract logic enforces business rules
5. **Cost Efficiency**: No backend hosting costs

## Considerations

1. **Gas Fees**: Each transaction costs gas (varies by network)
2. **Transaction Time**: Operations require blockchain confirmations
3. **Data Storage**: On-chain storage has associated costs
4. **Error Handling**: Smart contract reverts need proper handling

## Usage Example

```typescript
// Old way (axios)
const response = await axios.post(`http://localhost:3006/escrows`, escrowData);

// New way (smart contract)
const result = await createEscrowContract(
  api,
  account,
  signer,
  creatorAddress,
  counterpartyAddress,
  counterpartyType,
  title,
  description,
  totalAmount,
  milestones
);
```

## Testing

The migration maintains backward compatibility with the existing interface. All functions return the same response structure, so existing components should continue to work without changes.

## Next Steps

1. Test all functions with the smart contract
2. Update error handling for smart contract specific errors
3. Add transaction confirmation UI
4. Implement gas estimation
5. Add fallback mechanisms for failed transactions
