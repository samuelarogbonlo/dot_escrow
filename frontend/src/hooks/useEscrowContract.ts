import { useCallback } from 'react';
import { ApiPromise } from '@polkadot/api';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import type { Signer } from '@polkadot/api/types';
import axios from 'axios'

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
  status: 'Active' | 'Completed' | 'Disputed' | 'Cancelled' | 'Inactive';
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

  // Create a new escrow
  const createEscrow = useCallback(async (
    userAddress: string,
    counterpartyAddress: string,
    counterpartyType: string,
    status: string,
    title: string,
    description: string,
    totalAmount: string,
    milestones: { id: string, description: string, amount: string, status: string, deadline: number }[]
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

      // Placeholder for actual contract call
      // In a real implementation, you would:
      // 1. Call the escrow contract to create a new escrow
      // 2. Submit the transaction with the proper parameters

      console.log('Creating escrow with:', { userAddress, counterpartyAddress, counterpartyType, status, title, description, totalAmount, milestones });

      const escrowFormData = {
        userAddress,
        counterpartyAddress,
        counterpartyType,
        totalAmount,
        status,
        title,
        description,
        milestones
      }

      const result = { ...escrowFormData, createdAt: Date.now() }

      const response = await axios.post(`http://localhost:3006/escrows`,
        result, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(response.data)

      const id = response.data?.id

      if (id) {
        // Mock successful response for now
        // In a real app, this would be the transaction hash or escrow ID
        return {
          success: true,
          escrowId: id
        };
      }

    } catch (error) {
      console.log(error)
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
      // Placeholder for actual contract call
      // In a real implementation, you would query the escrow contract for details

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

  // List all escrows for the current account
  const listEscrows = useCallback(async () => {
    if (!api || !account) {
      return { success: false, error: 'API or account not available' };
    }

    try {
      // Placeholder for actual contract call
      // In a real implementation, you would query all escrows for the account

      console.log('Listing escrows for account:', account.address);

      // Mock response for now
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

      // Placeholder for actual contract call
      console.log('Releasing milestone:', { escrowId, milestoneId, account: account.address });

      // Mock successful response
      return {
        success: true,
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

      // Placeholder for actual contract call
      console.log('Disputing milestone:', { escrowId, milestoneId, reason, account: account.address });

      // Mock successful response
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

  return {
    createEscrow,
    getEscrow,
    listEscrows,
    releaseMilestone,
    disputeMilestone,
  };
}; 