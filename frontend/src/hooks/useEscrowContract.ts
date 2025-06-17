import { useCallback } from 'react';
import { ApiPromise } from '@polkadot/api';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import type { Signer } from '@polkadot/api/types';
import axios from 'axios'
import { useUSDTContract } from './useUSDTContract'; // Import the USDT hook

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
  creator: string;
  worker: string;
  client: string;
  counterpartyAddress: string;
  counterpartyType: string;
  title: string;
  description: string;
  totalAmount: string;
  status: 'Active' | 'Completed' | 'Disputed' | 'Cancelled' | 'Inactive' | 'Pending' | 'Rejected';
  createdAt: number;
  milestones: {
    id: string;
    description: string;
    amount: string;
    status: 'Pending' | 'InProgress' | 'Completed' | 'Disputed';
    deadline: number;
  }[];
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

      // For test accounts, return mock success
      if (account?.meta.source === 'test') {
        console.log('[checkTransactionStatus] Mock success for test account');
        return {
          success: true,
          receipt: {
            status: 1,
            transactionHash,
            blockNumber: Date.now()
          }
        };
      }

      // Poll for transaction confirmation
      let attempts = 0;
      const maxAttempts = 30; // 30 attempts with 2-second intervals = 1 minute max wait

      while (attempts < maxAttempts) {
        try {
          // Get block hash where transaction was included
          const blockHash = await api.rpc.chain.getBlockHash();
          const signedBlock = await api.rpc.chain.getBlock(blockHash);

          // Check if our transaction is in this block
          const txFound = signedBlock.block.extrinsics.find(
            ext => ext.hash.toHex() === transactionHash
          );

          if (txFound) {
            console.log('[checkTransactionStatus] Transaction found and confirmed');
            return {
              success: true,
              receipt: {
                status: 1,
                transactionHash,
                blockHash: blockHash.toHex(),
                blockNumber: signedBlock.block.header.number.toNumber()
              }
            };
          }

          // Transaction not yet confirmed, wait and try again
          console.log(`[checkTransactionStatus] Attempt ${attempts + 1}/${maxAttempts} - waiting...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          attempts++;

        } catch (error) {
          console.warn(`[checkTransactionStatus] Check attempt ${attempts + 1} failed:`, error);
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      // Transaction not confirmed within timeout
      console.error('[checkTransactionStatus] Transaction confirmation timeout');
      return {
        success: false,
        error: "Transaction confirmation timeout - please check manually"
      };

    } catch (error) {
      console.error('[checkTransactionStatus] Error checking transaction status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to check transaction status"
      };
    }
  }, [api, account]);

  // Create a new escrow
  const createEscrow = useCallback(async (
    userAddress: string,
    counterpartyAddress: string,
    counterpartyType: string,
    status: string,
    title: string,
    description: string,
    totalAmount: string,
    milestones: { id: string, description: string, amount: string, status: string, deadline: number }[],
    transactionHash?: string // Optional transaction hash from USDT transfer
  ) => {
    if (!api || !account) {
      return { success: false, error: 'API or account not available' };
    }

    try {
      // Get the signer for the current account
      const signerResult = await getAccountSigner(account.address);
      if (!signerResult.success) {
        return { success: false, error: signerResult.error };
      }

      console.log('Creating escrow with:', {
        userAddress,
        counterpartyAddress,
        counterpartyType,
        status,
        title,
        description,
        totalAmount,
        milestones,
        transactionHash
      });

      const escrowFormData = {
        userAddress,
        counterpartyAddress,
        counterpartyType,
        totalAmount,
        status,
        title,
        description,
        milestones,
        transactionHash, // Include transaction hash
        createdAt: Date.now()
      }

      const response = await axios.post(`http://localhost:3006/escrows`,
        escrowFormData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log('Escrow creation response:', response.data);

      const id = response.data?.id;

      if (id) {
        return {
          recipientAddress: counterpartyAddress,
          success: true,
          escrowId: id,
          transactionHash
        };
      } else {
        return { success: false, error: 'Failed to get escrow ID from response' };
      }

    } catch (error) {
      console.error('Error creating escrow:', error);
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to create escrow';
      return { success: false, error: errorMessage };
    }
  }, [api, account, getAccountSigner]);

  // Get an escrow by ID
  const getEscrow = useCallback(async (escrowId: string) => {
    if (!api) {
      return { success: false, error: 'API not available' };
    }

    try {
      console.log('Getting escrow with ID:', escrowId);

      const response = await axios.get(`http://localhost:3006/escrows/${escrowId}`)

      const mockEscrow = response.data

      return {
        success: true,
        escrow: mockEscrow
      };
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to get escrow details';
      return { success: false, error: errorMessage };
    }
  }, [api, account]);

  // Update escrow status
  const updateEscrowStatus = useCallback(async (escrowId: string, newStatus: string, transactionHash?: string) => {
    if (!api || !account) {
      return { success: false, error: 'API or account not available' };
    }

    try {
      // Get the signer for the current account (for authentication/verification)
      const signerResult = await getAccountSigner(account.address);
      if (!signerResult.success) {
        return { success: false, error: signerResult.error };
      }

      console.log('Updating escrow status:', { escrowId, newStatus, account: account.address });

      // Prepare the update data
      const updateData = {
        status: newStatus,
        transactionHash: transactionHash,
        updatedBy: account.address,
        updatedAt: Date.now()
      };

      // Make the API call to update the escrow status
      const response = await axios.patch(
        `http://localhost:3006/escrows/${escrowId}`,
        updateData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log('Update response:', response.data);

      if (response.data) {
        return {
          success: true,
          escrow: response.data,
          message: `Escrow status updated to ${newStatus}`
        };
      } else {
        return {
          success: false,
          error: 'Failed to update escrow status'
        };
      }

    } catch (error) {
      console.error('Error updating escrow status:', error);
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to update escrow status';
      return { success: false, error: errorMessage };
    }
  }, [api, account, getAccountSigner]);

  // Update escrow milestone status
  const updateEscrowMilestoneStatus = useCallback(async (escrowId: string, milestone: any, newStatus: string) => {
    if (!api || !account) {
      return { success: false, error: 'API or account not available' };
    }

    try {
      // Get the signer for the current account (for authentication/verification)
      const signerResult = await getAccountSigner(account.address);
      if (!signerResult.success) {
        return { success: false, error: signerResult.error };
      }

      console.log('Updating escrow status:', { escrowId, milestone, newStatus, account: account.address });

      // First, get the current escrow data to preserve all milestones
      const currentEscrowResponse = await axios.get(`http://localhost:3006/escrows/${escrowId}`);

      if (!currentEscrowResponse.data) {
        return { success: false, error: 'Failed to fetch current escrow data' };
      }

      const currentEscrow = currentEscrowResponse.data;

      // Update only the specific milestone while preserving all others
      const updatedMilestones = currentEscrow.milestones.map((m: any) =>
        m.id === milestone.id
          ? { ...m, status: newStatus }
          : m
      );

      // Prepare the update data with ALL milestones (preserving the ones not being updated)
      const updateData = {
        milestones: updatedMilestones
      };

      // Make the API call to update the escrow status
      const response = await axios.patch(
        `http://localhost:3006/escrows/${escrowId}`,
        updateData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log('Update response:', response.data);

      if (response.data) {
        return {
          success: true,
          escrow: response.data,
          message: `Milestone status updated to ${newStatus}`
        };
      } else {
        return {
          success: false,
          error: 'Failed to update milestone status'
        };
      }

    } catch (error) {
      console.error('Error updating milestone status:', error);
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to update milestone status';
      return { success: false, error: errorMessage };
    }
  }, [api, account, getAccountSigner]);

  // List all escrows for the current account
  const listEscrows = useCallback(async () => {
    if (!api || !account) {
      return { success: false, error: 'API or account not available' };
    }

    try {
      console.log('Listing escrows for account:', account.address);

      const response = await axios.get(`http://localhost:3006/escrows`)

      const mockEscrows = response.data

      return {
        success: true,
        escrows: mockEscrows
      };
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to list escrows';
      return { success: false, error: errorMessage };
    }
  }, [api, account]);

  // Release funds for a milestone
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

      console.log('Releasing milestone:', { escrowId, milestoneId, account: account.address });

      // Mock successful response
      return {
        success: true,
        recieverAddress: '',
        payerAddress: '',
        transactionHash: `tx-${Date.now()}`
      };
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to release milestone funds';
      return { success: false, error: errorMessage };
    }
  }, [api, account, getAccountSigner]);

  // Dispute a milestone
  const disputeMilestone = useCallback(async (escrowId: string, milestoneId: string, reason: string) => {
    if (!api || !account) {
      return { success: false, error: 'API or account not available' };
    }

    try {
      // Get the signer for the current account
      const signerResult = await getAccountSigner(account.address);
      if (!signerResult.success) {
        return { success: false, error: signerResult.error };
      }

      console.log('Disputing milestone:', { escrowId, milestoneId, reason, account: account.address });

      const disputeData = {
        escrowId,
        milestoneId,
        reason,
        filedBy: account.address,
        disputeId: `dispute-${Date.now()}`,
        createdAt: Date.now()
      }

      const response = await axios.post(`http://localhost:3006/escrows`,
        disputeData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      return {
        success: true,
        disputeId: `dispute-${Date.now()}`
      };
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to dispute milestone';
      return { success: false, error: errorMessage };
    }
  }, [api, account, getAccountSigner]);

  // Notify counterparty about escrow
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

      console.log('Notifying counterparty for escrow:', {
        escrowId,
        notificationType,
        recipientAddress,
        message,
        type,
        senderAddress: account.address
      });

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
    checkTransactionStatus
  };
};