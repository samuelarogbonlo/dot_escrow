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
          recipientAddress: counterpartyAddress,
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

  // Update escrow status
  const updateEscrowStatus = useCallback(async (escrowId: string, newStatus: string) => {
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

      // Placeholder for actual contract call
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
    updateEscrowMilestoneStatus

  };

};