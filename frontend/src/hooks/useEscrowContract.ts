import { useCallback } from 'react';
import { ApiPromise } from '@polkadot/api';
import axios from 'axios';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import type { Signer } from '@polkadot/api/types';
import {
  createEscrowContract,
  getEscrowContract,
  listEscrowsContract,
  updateEscrowStatusContract,
  updateMilestoneStatusContract,
  releaseMilestoneContract,
  disputeMilestoneContract,
  type EscrowContractCall
} from '../utils/escrowContractUtils';

// Create a mock signer for testing
const createMockSigner = (): Signer => {
  return {
    signPayload: async () => ({
      signature: '0x1234567890',
      id: 1,
    }),
    signRaw: async () => ({
      signature: '0x1234567890',
      id: 1,
    }),
    update: () => Promise.resolve(),
  };
};

export interface EscrowData {
  id: string;
  creatorAddress: string;
  counterpartyAddress: string;
  counterpartyType: string;
  title: string;
  description: string;
  totalAmount: string;
  status: 'Active' | 'Completed' | 'Disputed' | 'Inactive' | 'Pending' | 'Rejected';
  createdAt: number;
  milestones: {
    id: string;
    description: string;
    amount: string;
    status: 'Pending' | 'InProgress' | 'Completed' | 'Disputed' | 'Overdue';
    deadline: number;
  }[];
  transactionHash?: string
}

interface UseEscrowContractOptions {
  api: ApiPromise | null;
  account: InjectedAccountWithMeta | null;
  getSigner: (address: string) => Promise<any>;
}

export const useEscrowContract = ({ api, account, getSigner }: UseEscrowContractOptions) => {

  // Get USDT contract functions

  // Helper to get signer with test mode support
  const getAccountSigner = useCallback(async (address: string) => {
    try {
      // Check if this is a test account
      if (account?.meta.source === 'test') {
        console.log('[EscrowContract] Using mock signer for test account');
        return { success: true, signer: createMockSigner() };
      }

      // Otherwise use actual signer
      return await getSigner(address);
    } catch (error) {
      console.error('[EscrowContract] Error getting signer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get signer'
      };
    }
  }, [account, getSigner]);


  // Helper function to check transaction status
  const checkTransactionStatus = useCallback(async (transactionHash: string) => {
    if (!api) {
      throw new Error('API not available');
    }

    try {
      console.log('[checkTransactionStatus] Checking transaction:', transactionHash);

      // Option 1: Try to get transaction info using runtime call
      try {
        // First, we need to find the transaction to get its details
        const latestBlockHash = await api.rpc.chain.getBlockHash();

        // Check if transactionPaymentApi is available
        if (api.call.transactionPaymentApi && api.call.transactionPaymentApi.queryInfo) {
          // We need the actual transaction object, not just the hash
          // So we'll search for it first, then query info
          console.log('[checkTransactionStatus] Searching for transaction to get payment info...');

          const latestBlock = await api.rpc.chain.getBlock(latestBlockHash);
          const currentBlockNumber = latestBlock.block.header.number.toNumber();

          // Search recent blocks for the transaction
          const blocksToSearch = 10; // Search fewer blocks for the initial check
          const startBlock = Math.max(1, currentBlockNumber - blocksToSearch);

          for (let blockNum = currentBlockNumber; blockNum >= startBlock; blockNum--) {
            try {
              const blockHash = await api.rpc.chain.getBlockHash(blockNum);
              const signedBlock = await api.rpc.chain.getBlock(blockHash);

              const txFound = signedBlock.block.extrinsics.find(
                ext => ext.hash.toHex() === transactionHash
              );

              if (txFound) {
                console.log(`[checkTransactionStatus] Transaction found in block ${blockNum}, querying payment info...`);

                // Now we can query the transaction payment info
                try {
                  const txPaymentInfo = await api.call.transactionPaymentApi.queryInfo(
                    txFound,
                    blockHash
                  );

                  console.log('[checkTransactionStatus] Payment info retrieved:', txPaymentInfo);

                  // Check if the block is finalized
                  const finalizedHash = await api.rpc.chain.getFinalizedHead();
                  const finalizedBlock = await api.rpc.chain.getBlock(finalizedHash);
                  const finalizedBlockNumber = finalizedBlock.block.header.number.toNumber();
                  const isFinalized = blockNum <= finalizedBlockNumber;



                  return {
                    success: true,
                    receipt: {
                      status: 1,
                      transactionHash,
                      blockHash: blockHash.toHex(),
                      blockNumber: blockNum,
                      finalized: isFinalized,

                    }
                  };
                } catch (paymentError) {
                  console.log('[checkTransactionStatus] Payment info query failed:', paymentError);
                  // Continue with basic transaction info
                  const finalizedHash = await api.rpc.chain.getFinalizedHead();
                  const finalizedBlock = await api.rpc.chain.getBlock(finalizedHash);
                  const finalizedBlockNumber = finalizedBlock.block.header.number.toNumber();
                  const isFinalized = blockNum <= finalizedBlockNumber;

                  return {
                    success: true,
                    receipt: {
                      status: 1,
                      transactionHash,
                      blockHash: blockHash.toHex(),
                      blockNumber: blockNum,
                      finalized: isFinalized
                    }
                  };
                }
              }
            } catch (error) {
              console.warn(`[checkTransactionStatus] Error checking block ${blockNum}:`, error);
              continue;
            }
          }
        } else {
          console.log('[checkTransactionStatus] transactionPaymentApi not available, falling back to block search...');
        }
      } catch (error) {
        console.log('[checkTransactionStatus] Runtime call failed, searching blocks...', error);
      }

      // Fallback: Extended block search (your original logic)
      const latestBlockHash = await api.rpc.chain.getBlockHash();
      const latestBlock = await api.rpc.chain.getBlock(latestBlockHash);
      const currentBlockNumber = latestBlock.block.header.number.toNumber();

      // Search the last 50 blocks (adjust as needed)
      const blocksToSearch = 50;
      const startBlock = Math.max(1, currentBlockNumber - blocksToSearch);

      console.log(`[checkTransactionStatus] Fallback: Searching blocks ${startBlock} to ${currentBlockNumber}`);

      for (let blockNum = currentBlockNumber; blockNum >= startBlock; blockNum--) {
        try {
          const blockHash = await api.rpc.chain.getBlockHash(blockNum);
          const signedBlock = await api.rpc.chain.getBlock(blockHash);

          // Check if our transaction is in this block
          const txFound = signedBlock.block.extrinsics.find(
            ext => ext.hash.toHex() === transactionHash
          );

          if (txFound) {
            console.log(`[checkTransactionStatus] Transaction found in block ${blockNum}`);

            // Check if the block is finalized
            const finalizedHash = await api.rpc.chain.getFinalizedHead();
            const finalizedBlock = await api.rpc.chain.getBlock(finalizedHash);
            const finalizedBlockNumber = finalizedBlock.block.header.number.toNumber();

            const isFinalized = blockNum <= finalizedBlockNumber;

            return {
              success: true,
              receipt: {
                status: 1,
                transactionHash,
                blockHash: blockHash.toHex(),
                blockNumber: blockNum,
                finalized: isFinalized
              }
            };
          }
        } catch (error) {
          console.warn(`[checkTransactionStatus] Error checking block ${blockNum}:`, error);
          continue; // Continue to next block
        }
      }

      // Transaction not found
      console.log('[checkTransactionStatus] Transaction not found in recent blocks');
      return {
        success: false,
        error: "Transaction not found in recent blocks"
      };

    } catch (error) {
      console.error('[checkTransactionStatus] Error checking transaction status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to check transaction status"
      };
    }
  }, [api]);

  // Create a new escrow using smart contract
  const createEscrow = useCallback(async (
    creatorAddress: string,
    counterpartyAddress: string,
    counterpartyType: string,
    status: string,
    title: string,
    description: string,
    totalAmount: string,
    milestones: { id: string, description: string, amount: string, status: 'Pending' | 'InProgress' | 'Completed' | 'Disputed' | 'Overdue', deadline: number }[],
    transactionHash?: string | undefined // Optional transaction hash from USDT transfer
  ) => {
    if (!api || !account) {
      return { success: false, error: 'API or account not available' };
    }

    try {
     

      console.log('[useEscrowContract] Creating escrow via smart contract...');

      // Call the smart contract to create escrow
      // Always use the selected account address as creator to ensure consistency
      const actualCreatorAddress = account.address;
      console.log('[useEscrowContract] Using creator address:', actualCreatorAddress, 'vs passed:', creatorAddress);
      
      const result: EscrowContractCall = await createEscrowContract(
        api,
        account,
        actualCreatorAddress, // Use account.address instead of passed creatorAddress
        counterpartyAddress,
        counterpartyType,
        status,
        title,
        description,
        totalAmount,
        milestones,
        transactionHash,
      );

      

      if (result.success) {
        console.log('[useEscrowContract] Escrow created successfully via smart contract', result);
        return {
          recipientAddress: counterpartyAddress,
          success: true,
          escrowId: result.escrowId, // Use transaction hash as temporary ID
          transactionHash: result.transactionHash
        };
      } else {
        console.error('[useEscrowContract] Smart contract call failed:', result.error);
        return { success: false, error: result.error || 'Failed to create escrow via smart contract' };
      }

    } catch (error) {
      console.error('[useEscrowContract] Error creating escrow:', error);
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to create escrow';
      return { success: false, error: errorMessage };
    }
  }, [api, account]);

  // Get an escrow by ID from smart contract
  const getEscrow = useCallback(async (escrowId: string) => {
    if (!api || !account) {
      return { success: false, error: 'API not available' };
    }

    try {
      console.log('[useEscrowContract] Getting escrow from smart contract:', escrowId);

      // Call the smart contract to get escrow details
      const result: EscrowContractCall = await getEscrowContract(api, account, escrowId);

      if (result.success) {
        console.log('[useEscrowContract] Escrow retrieved successfully from smart contract', result.data);
        return {
          success: true,
          escrow: result.data
        };
      } else {
        console.error('[useEscrowContract] Smart contract call failed:', result.error);
        return { success: false, error: result.error || 'Failed to get escrow from smart contract' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to get escrow details';
      return { success: false, error: errorMessage };
    }
  }, [api, account]);


  // Update escrow status using smart contract
  const updateEscrowStatus = useCallback(async (escrowId: string, newStatus: string, transactionHash?: string, note?: string) => {
    if (!api || !account) {
      return { success: false, error: 'API or account not available' };
    }

    try {
      // Get the signer for the current account
      const signerResult = await getAccountSigner(account.address);
      if (!signerResult.success) {
        return { success: false, error: signerResult.error };
      }

      console.log('[useEscrowContract] Updating escrow status via smart contract:', { escrowId, newStatus, account: account.address });

      // Call the smart contract to update escrow status
      const result: EscrowContractCall = await updateEscrowStatusContract(
        api,
        account,
        escrowId,
        newStatus,
        transactionHash
      );

      if (result.success) {
        console.log('[useEscrowContract] Escrow status updated successfully via smart contract');
        return {
          success: true,
          escrow: { id: escrowId, status: newStatus, transactionHash: result.transactionHash },
          message: `Escrow status updated to ${newStatus}`,
          transactionHash: result.transactionHash
        };
      } else {
        console.error('[useEscrowContract] Smart contract call failed:', result.error);
        return {
          success: false,
          error: result.error || 'Failed to update escrow status via smart contract'
        };
      }

    } catch (error) {
      console.error('[useEscrowContract] Error updating escrow status:', error);
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to update escrow status';
      return { success: false, error: errorMessage };
    }
  }, [api, account, getAccountSigner]);

  // Update escrow milestone status using smart contract
  const updateEscrowMilestoneStatus = useCallback(async (escrowId: string, milestone: any, newStatus: string) => {
    if (!api || !account) {
      return { success: false, error: 'API or account not available' };
    }

    try {
      // Get the signer for the current account
      const signerResult = await getAccountSigner(account.address);
      if (!signerResult.success) {
        return { success: false, error: signerResult.error };
      }

      console.log('[useEscrowContract] Updating milestone status via smart contract:', { escrowId, milestone, newStatus, account: account.address });

      // Call the smart contract to update milestone status
      const result: EscrowContractCall = await updateMilestoneStatusContract(
        api,
        account,
        escrowId,
        milestone,
        newStatus
      );

      if (result.success) {
        console.log('[useEscrowContract] Milestone status updated successfully via smart contract');
        return {
          success: true,
          escrow: { id: escrowId, milestones: [{ ...milestone, status: newStatus }] },
          message: `Milestone status updated to ${newStatus}`,
          transactionHash: result.transactionHash
        };
      } else {
        console.error('[useEscrowContract] Smart contract call failed:', result.error);
        return {
          success: false,
          error: result.error || 'Failed to update milestone status via smart contract'
        };
      }

    } catch (error) {
      console.error('[useEscrowContract] Error updating milestone status:', error);
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to update milestone status';
      return { success: false, error: errorMessage };
    }
  }, [api, account, getAccountSigner]);

  // List all escrows for the current account from smart contract
  const listEscrows = useCallback(async () => {
    if (!api || !account) {
      return { success: false, error: 'API or account not available' };
    }

    try {
      console.log('[useEscrowContract] Listing escrows from smart contract for account:', account.address);

      // Call the smart contract to list escrows
      const result: EscrowContractCall = await listEscrowsContract(api, account);

      if (result.success) {
        console.log('[useEscrowContract] Escrows retrieved successfully from smart contract');
        return {
          success: true,
          escrows: result.data || []
        };
      } else {
        console.error('[useEscrowContract] Smart contract call failed:', result.error);
        return { success: false, error: result.error || 'Failed to list escrows from smart contract' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to list escrows';
      return { success: false, error: errorMessage };
    }
  }, [api, account]);

  // Release funds for a milestone using smart contract
  const releaseMilestone = useCallback(async (escrowId: string, milestoneId: string) => {
    if (!api || !account) {
      return { success: false, error: 'API or account not available' };
    }

    try {
      // Get the signer for the current account
      const signerResult = await getAccountSigner(account.address);
      if (!signerResult.success) {
        return { success: false, error: signerResult.error };
      }

      console.log('[useEscrowContract] Releasing milestone via smart contract:', { escrowId, milestoneId, account: account.address });

      // Call the smart contract to release milestone
      const result: EscrowContractCall = await releaseMilestoneContract(
        api,
        account,
        escrowId,
        milestoneId
      );

      if (result.success) {
        console.log('[useEscrowContract] Milestone released successfully via smart contract');
        return {
          success: true,
          recieverAddress: account.address, // The account releasing the milestone
          payerAddress: account.address,
          transactionHash: result.transactionHash
        };
      } else {
        console.error('[useEscrowContract] Smart contract call failed:', result.error);
        return { success: false, error: result.error || 'Failed to release milestone via smart contract' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to release milestone funds';
      return { success: false, error: errorMessage };
    }
  }, [api, account, getAccountSigner]);

  // Dispute a milestone using smart contract
  const disputeMilestone = useCallback(async (escrowId: string, milestoneId: string, reason: string, filedBy: string, filedByRole: string, status: string) => {
    if (!api || !account) {
      return { success: false, error: 'API or account not available' };
    }

    try {
      // Get the signer for the current account
      const signerResult = await getAccountSigner(account.address);
      if (!signerResult.success) {
        return { success: false, error: signerResult.error };
      }

      console.log('[useEscrowContract] Disputing milestone via smart contract:', { escrowId, milestoneId, reason, filedBy, filedByRole, status });

      // Call the smart contract to dispute milestone
      const result: EscrowContractCall = await disputeMilestoneContract(
        api,
        account,
        escrowId,
        milestoneId,
        reason
      );

      if (result.success) {
        console.log('[useEscrowContract] Milestone disputed successfully via smart contract');
        return {
          success: true,
          escrowId: escrowId,
          message: 'Milestone disputed successfully',
          transactionHash: result.transactionHash
        };
      } else {
        console.error('[useEscrowContract] Smart contract call failed:', result.error);
        return { success: false, error: result.error || 'Failed to dispute milestone via smart contract' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to dispute milestone';
      return { success: false, error: errorMessage };
    }
  }, [api, account, getAccountSigner]);

  // Notify counterparty about escrow using smart contract
   const notifyCounterparty = useCallback(async (
    escrowId: string,
    notificationType: string,
    recipientAddress: string,
    message?: string,
    type?: 'info' | 'success' | 'warning',
  ) => {
    if (!api || !account) {
      return { success: false, error: 'API or account not available' };
    }

    try {
      // Get the signer for the current account (if needed for verification)
      const signerResult = await getAccountSigner(account.address);
      if (!signerResult.success) {
        return { success: false, error: signerResult.error };
      }



      // Prepare notification data
      const notificationData = {
        escrowId,
        notificationType,
        senderAddress: account.address,
        message: message || '',
        type,
        recipientAddress,
        timestamp: Date.now(),
        read: false
      };

      // Make API call to notify counterparty
      const response = await axios.post(
        `http://localhost:3006/notify`,
        notificationData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log('Notification response:', response.data);

      if (response.data?.success) {
        return {
          success: true,
          notificationId: response.data.notificationId,
          message: response.data.message || 'Counterparty notified successfully'
        };
      } else {
        return {
          success: false,
          error: response.data?.error || 'Failed to notify counterparty'
        };
      }

    } catch (error) {
      console.error('Error notifying counterparty:', error);
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to notify counterparty';
      return { success: false, error: errorMessage };
    }
  }, [api, account, getAccountSigner]);


  return {
    createEscrow,
    getEscrow,
    listEscrows,
    releaseMilestone,
    disputeMilestone,
    notifyCounterparty,
    updateEscrowStatus,
    updateEscrowMilestoneStatus,
    checkTransactionStatus,
  };
};