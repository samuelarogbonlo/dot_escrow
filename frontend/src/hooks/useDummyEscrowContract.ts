import { useCallback, useEffect, useState } from 'react';
import { ContractPromise } from '@polkadot/api-contract';
import type { Signer } from '@polkadot/api/types';
// import { ESCROW_CONTRACT_ABI } from '@/contractABI/EscrowABI';
import { ESCROW_CONTRACT_ABI } from '@/contractABI/EscrowABI';

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
  creator_address: string;
  counterparty_address: string;
  counterparty_type: string;
  title: string;
  description: string;
  total_amount: string;
  status: 'Active' | 'Completed' | 'Disputed' | 'Cancelled' | 'Inactive' | 'Pending' | 'Rejected';
  created_at: number;
  milestones: {
    id: string;
    description: string;
    amount: string;
    status: 'Pending' | 'InProgress' | 'Completed' | 'Disputed' | 'Overdue';
    deadline: number;
  }[];
}

interface UseEscrowContractOptions {
  api: any;
  account: any;
  getSigner: (address: string) => Promise<any>;
}

const ESCROW_CONTRACT_ADDRESS = "5GvRMZSLS6UzHwExFuw5Fw9Ybic1gRdWH9LFy79ssDbDiWvU";

export const useEscrowContract = ({
  api,
  account,
  getSigner,
}: UseEscrowContractOptions) => {
  const [contract, setContract] = useState<ContractPromise | null>(null);
  const [isContractReady, setIsContractReady] = useState(false);
  const [contractError, setContractError] = useState<string | null>(null);


  // Initialize contract with better debugging
  useEffect(() => {


    console.log('[Contract Debug] useEffect triggered with:', {
      hasApi: !!api,
      hasAddress: !!ESCROW_CONTRACT_ADDRESS,
      hasABI: !!ESCROW_CONTRACT_ABI,
      account: account?.address || 'No account'
    });

    if (!api) {
      console.warn('[Contract Debug] API not available');
      setContractError('API not available');
      return;
    }

    if (!ESCROW_CONTRACT_ADDRESS) {
      console.warn('[Contract Debug] Contract address not available');
      setContractError('Contract address not available');
      return;
    }

    if (!ESCROW_CONTRACT_ABI) {
      console.warn('[Contract Debug] Contract ABI not available');
      setContractError('Contract ABI not available');
      return;
    }

    try {
      console.log('[Contract Debug] Attempting to create contract instance...');
      const contractInstance = new ContractPromise(api, ESCROW_CONTRACT_ABI, ESCROW_CONTRACT_ADDRESS);

      console.log('[Contract Debug] Contract instance created:', contractInstance);
      console.log('[Contract Debug] Contract address:', contractInstance.address.toString());
      console.log('[Contract Debug] Contract methods:', Object.keys(contractInstance.query));

      setContract(contractInstance);
      setIsContractReady(true);
      setContractError(null);
      console.log('[Contract Debug] Contract initialized successfully');
    } catch (error) {
      console.error('[Contract Debug] Error initializing contract:', error);
      setContract(null);
      setIsContractReady(false);
      setContractError(error instanceof Error ? error.message : 'Unknown contract initialization error');
    }
  }, [api, ESCROW_CONTRACT_ADDRESS]);


  // Log contract state changes
  useEffect(() => {
    console.log('[Contract Debug] Contract state changed:', {
      contract: contract,
      isContractReady,
      contractError,
      hasContract: !!contract
    });
  }, [contract, isContractReady, contractError]);

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

  // Add validation helper
  const validateContractReady = useCallback(() => {
    const isReady = !!(api && account && contract && isContractReady);
    console.log('[Contract Debug] Validation check:', {
      hasApi: !!api,
      hasAccount: !!account,
      hasContract: !!contract,
      isContractReady,
      isReady,
      contractError
    });
    return isReady;
  }, [api, account, contract, isContractReady, contractError]);

  // Helper function to check transaction status
  const checkTransactionStatus = useCallback(async (transactionHash: string) => {
    if (!validateContractReady()) {
      return { success: false, error: 'API, account, or contract not available' };
    }

    try {
      console.log('[checkTransactionStatus] Checking transaction:', transactionHash);

      // Use the smart contract method to check transaction status
      const { result } = await contract!.query.checkTransactionStatus(
        account.address,
        transaction_hash
      );

      if (result.isOk) {
        const txStatus = result.value.unwrap();
        return {
          success: true,
          receipt: {
            status: txStatus.status === 'Success' ? 1 : 0,
            transactionHash: txStatus.transaction_hash,
            blockNumber: txStatus.block_number ? parseInt(txStatus.block_number) : undefined,
            confirmations: txStatus.confirmations,
            gasUsed: txStatus.gas_used
          }
        };
      } else {
        return {
          success: false,
          error: result.asErr.toString()
        };
      }
    } catch (error) {
      console.error('[checkTransactionStatus] Error checking transaction status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to check transaction status"
      };
    }
  }, [api, contract, account, validateContractReady]);

  // Create a new escrow
  const createEscrow = useCallback(async (
    creatorAddress: string,
    counterpartyAddress: string,
    counterpartyType: string,
    status: string,
    title: string,
    description: string,
    totalAmount: string,
    milestones: { id: string, description: string, amount: string, status: string, deadline: number }[],
    transactionHash?: string
  ) => {
    if (!validateContractReady()) {
      return { success: false, error: 'API, account, or contract not available' };
    }

    try {
      // Get the signer for the current account
      const signerResult = await getAccountSigner(account.address);
      if (!signerResult.success) {
        return { success: false, error: signerResult.error };
      }

      const signer = signerResult.signer;

      console.log('Creating escrow with smart contract:', {
        creatorAddress,
        counterpartyAddress,
        counterpartyType,
        status,
        title,
        description,
        totalAmount,
        milestones,
        transactionHash
      });

      // First, estimate gas
      const { gasRequired, storageDeposit, result } = await contract!.query.createEscrow(
        account.address,
        creatorAddress,
        counterpartyAddress,
        counterpartyType,
        status,
        title,
        description,
        totalAmount,
        milestones,
        transactionHash ? { Some: transactionHash } : { None: null }
      );

      // Check if the query was successful
      if (result.isErr) {
        return { success: false, error: result.asErr.toString() };
      }

      // Connect contract with signer and execute transaction
      const contractWithSigner = contract!.connect(signer);

      const tx = await contractWithSigner.tx.createEscrow(
        {
          gasLimit: gasRequired,
          storageDepositLimit: storageDeposit.isCharge ? storageDeposit.asCharge : null,
        },
        creatorAddress,
        counterpartyAddress,
        counterpartyType,
        status,
        title,
        description,
        totalAmount,
        milestones,
        transactionHash ? { Some: transactionHash } : { None: null }
      );

      // Wait for the transaction to be included in a block
      const txResult = await new Promise<any>((resolve, reject) => {
        tx.signAndSend(signer, ({ status, events, txHash }) => {
          if (status.isInBlock) {
            console.log('Transaction included in block:', status.asInBlock.toString());

            // Look for EscrowCreated event
            const escrowCreatedEvent = events.find(({ event }) =>
              event.section === 'contracts' &&
              event.method === 'ContractEmitted'
            );

            resolve({
              success: true,
              blockHash: status.asInBlock.toString(),
              txHash: txHash.toString(),
              events: events
            });
          } else if (status.isError) {
            reject(new Error('Transaction failed'));
          }
        }).catch(reject);
      });

      // Extract escrow ID from the contract result
      const escrowId = result.value.unwrap();

      return {
        recipientAddress: counterpartyAddress,
        success: true,
        escrowId: escrowId,
        transactionHash: txResult.txHash,
        blockHash: txResult.blockHash
      };

    } catch (error) {
      console.error('Error creating escrow:', error);
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to create escrow';
      return { success: false, error: errorMessage };
    }
  }, [account, contract, getAccountSigner, validateContractReady]);

  // Get an escrow by ID
  const getEscrow = useCallback(async (escrowId: string) => {
    if (!validateContractReady()) {
      return { success: false, error: 'API, contract, or account not available' };
    }

    try {
      console.log('Getting escrow with ID:', escrowId);

      const { result } = await contract!.query.getEscrow(
        account.address,
        escrowId
      );

      if (result.isOk) {
        const escrowData = result.value.unwrap();
        return {
          success: true,
          escrow: escrowData
        };
      } else {
        return {
          success: false,
          error: result.asErr.toString()
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to get escrow details';
      return { success: false, error: errorMessage };
    }
  }, [contract, account, validateContractReady]);

  // Update escrow status
  const updateEscrowStatus = useCallback(async (
    escrowId: string,
    newStatus: string,
    transactionHash?: string,
    note?: string
  ) => {
    if (!validateContractReady()) {
      return { success: false, error: 'API, account, or contract not available' };
    }

    try {
      const signerResult = await getAccountSigner(account.address);
      if (!signerResult.success) {
        return { success: false, error: signerResult.error };
      }

      const signer = signerResult.signer;

      console.log('Updating escrow status:', { escrowId, newStatus, account: account.address });

      // Estimate gas
      const { gasRequired, storageDeposit, result } = await contract!.query.updateEscrowStatus(
        account.address,
        escrowId,
        newStatus,
        transactionHash ? { Some: transactionHash } : { None: null }
      );

      if (result.isErr) {
        return { success: false, error: result.asErr.toString() };
      }

      // Execute transaction
      const contractWithSigner = contract!.connect(signer);
      const tx = await contractWithSigner.tx.updateEscrowStatus(
        {
          gasLimit: gasRequired,
          storageDepositLimit: storageDeposit.isCharge ? storageDeposit.asCharge : null,
        },
        escrowId,
        newStatus,
        transactionHash ? { Some: transactionHash } : { None: null }
      );

      await new Promise((resolve, reject) => {
        tx.signAndSend(signer, ({ status }) => {
          if (status.isInBlock) {
            resolve(status.asInBlock.toString());
          } else if (status.isError) {
            reject(new Error('Transaction failed'));
          }
        }).catch(reject);
      });

      // Get updated escrow data
      const updatedEscrowResult = await getEscrow(escrowId);
      if (updatedEscrowResult.success) {
        return {
          success: true,
          escrow: updatedEscrowResult.escrow,
          message: `Escrow status updated to ${newStatus}`
        };
      }

      return { success: true, message: `Escrow status updated to ${newStatus}` };

    } catch (error) {
      console.error('Error updating escrow status:', error);
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to update escrow status';
      return { success: false, error: errorMessage };
    }
  }, [account, contract, getAccountSigner, getEscrow, validateContractReady]);

  // Update escrow milestone status
  const updateEscrowMilestoneStatus = useCallback(async (
    escrowId: string,
    milestone: any,
    newStatus: string
  ) => {
    if (!validateContractReady()) {
      return { success: false, error: 'API, account, or contract not available' };
    }

    try {
      const signerResult = await getAccountSigner(account.address);
      if (!signerResult.success) {
        return { success: false, error: signerResult.error };
      }

      const signer = signerResult.signer;

      console.log('Updating milestone status:', { escrowId, milestone, newStatus, account: account.address });

      // Update milestone object
      const updatedMilestone = { ...milestone, status: newStatus };

      // Estimate gas
      const { gasRequired, storageDeposit, result } = await contract!.query.updateEscrowMilestoneStatus(
        account.address,
        escrowId,
        updatedMilestone,
        newStatus
      );

      if (result.isErr) {
        return { success: false, error: result.asErr.toString() };
      }

      // Execute transaction
      const contractWithSigner = contract!.connect(signer);
      const tx = await contractWithSigner.tx.updateEscrowMilestoneStatus(
        {
          gasLimit: gasRequired,
          storageDepositLimit: storageDeposit.isCharge ? storageDeposit.asCharge : null,
        },
        escrowId,
        updatedMilestone,
        newStatus
      );

      await new Promise((resolve, reject) => {
        tx.signAndSend(signer, ({ status }) => {
          if (status.isInBlock) {
            resolve(status.asInBlock.toString());
          } else if (status.isError) {
            reject(new Error('Transaction failed'));
          }
        }).catch(reject);
      });

      // Get updated escrow data
      const updatedEscrowResult = await getEscrow(escrowId);
      if (updatedEscrowResult.success) {
        return {
          success: true,
          escrow: updatedEscrowResult.escrow,
          message: `Milestone status updated to ${newStatus}`
        };
      }

      return { success: true, message: `Milestone status updated to ${newStatus}` };

    } catch (error) {
      console.error('Error updating milestone status:', error);
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to update milestone status';
      return { success: false, error: errorMessage };
    }
  }, [account, contract, getAccountSigner, getEscrow, validateContractReady]);

  // List all escrows for the current account
  const listEscrows = useCallback(async () => {
    if (!validateContractReady()) {
      return { success: false, error: 'API, account, or contract not available' };
    }

    try {
      console.log('Listing escrows for account:', account.address);

      const { result } = await contract!.query.listEscrows(account.address);

      if (result.isOk) {
        const escrows = result.value.unwrap();
        return {
          success: true,
          escrows: escrows
        };
      } else {
        return {
          success: false,
          error: result.asErr.toString()
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to list escrows';
      return { success: false, error: errorMessage };
    }
  }, [account, contract, validateContractReady]);

  // Release funds for a milestone
  const releaseMilestone = useCallback(async (escrowId: string, milestoneId: string) => {
    if (!validateContractReady()) {
      return { success: false, error: 'API, account, or contract not available' };
    }

    try {
      const signerResult = await getAccountSigner(account.address);
      if (!signerResult.success) {
        return { success: false, error: signerResult.error };
      }

      const signer = signerResult.signer;

      console.log('Releasing milestone:', { escrowId, milestoneId, account: account.address });

      // Estimate gas
      const { gasRequired, storageDeposit, result } = await contract!.query.releaseMilestone(
        account.address,
        escrowId,
        milestoneId
      );

      if (result.isErr) {
        return { success: false, error: result.asErr.toString() };
      }

      // Execute transaction
      const contractWithSigner = contract!.connect(signer);
      const tx = await contractWithSigner.tx.releaseMilestone(
        {
          gasLimit: gasRequired,
          storageDepositLimit: storageDeposit.isCharge ? storageDeposit.asCharge : null,
        },
        escrowId,
        milestoneId
      );

      const txResult = await new Promise<any>((resolve, reject) => {
        tx.signAndSend(signer, ({ status, events, txHash }) => {
          if (status.isInBlock) {
            resolve({
              blockHash: status.asInBlock.toString(),
              txHash: txHash.toString(),
              events: events
            });
          } else if (status.isError) {
            reject(new Error('Transaction failed'));
          }
        }).catch(reject);
      });

      // Get the release result from contract query result
      const releaseResult = result.value.unwrap();

      return {
        success: true,
        receiverAddress: releaseResult.receiver_address,
        payerAddress: account.address,
        transactionHash: txResult.txHash
      };
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to release milestone funds';
      return { success: false, error: errorMessage };
    }
  }, [account, contract, getAccountSigner, validateContractReady]);

  // Dispute a milestone
  const disputeMilestone = useCallback(async (escrowId: string, milestoneId: string, reason: string) => {
    if (!validateContractReady()) {
      return { success: false, error: 'API, account, or contract not available' };
    }

    try {
      const signerResult = await getAccountSigner(account.address);
      if (!signerResult.success) {
        return { success: false, error: signerResult.error };
      }

      const signer = signerResult.signer;

      console.log('Disputing milestone:', { escrowId, milestoneId, reason, account: account.address });

      // Estimate gas
      const { gasRequired, storageDeposit, result } = await contract!.query.disputeMilestone(
        account.address,
        escrowId,
        milestoneId,
        reason
      );

      if (result.isErr) {
        return { success: false, error: result.asErr.toString() };
      }

      // Execute transaction
      const contractWithSigner = contract!.connect(signer);
      const tx = await contractWithSigner.tx.disputeMilestone(
        {
          gasLimit: gasRequired,
          storageDepositLimit: storageDeposit.isCharge ? storageDeposit.asCharge : null,
        },
        escrowId,
        milestoneId,
        reason
      );

      await new Promise((resolve, reject) => {
        tx.signAndSend(signer, ({ status }) => {
          if (status.isInBlock) {
            resolve(status.asInBlock.toString());
          } else if (status.isError) {
            reject(new Error('Transaction failed'));
          }
        }).catch(reject);
      });

      const disputeResult = result.value.unwrap();

      return {
        success: true,
        disputeId: disputeResult.dispute_id
      };
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to dispute milestone';
      return { success: false, error: errorMessage };
    }
  }, [account, contract, getAccountSigner, validateContractReady]);

  // Notify counterparty about escrow
  const notifyCounterparty = useCallback(async (
    escrowId: string,
    notificationType: string,
    recipientAddress: string,
    message?: string,
    type?: 'info' | 'success' | 'warning',
  ) => {
    if (!validateContractReady()) {
      return { success: false, error: 'API, account, or contract not available' };
    }

    try {
      const signerResult = await getAccountSigner(account.address);
      if (!signerResult.success) {
        return { success: false, error: signerResult.error };
      }

      const signer = signerResult.signer;

      console.log('Notifying counterparty:', {
        escrowId,
        notificationType,
        recipientAddress,
        message,
        account: account.address
      });

      // Estimate gas
      const { gasRequired, storageDeposit, result } = await contract!.query.notifyCounterparty(
        account.address,
        escrowId,
        notificationType,
        recipientAddress,
        message ? { Some: message } : { None: null },
        type ? { Some: type } : { None: null }
      );

      if (result.isErr) {
        return { success: false, error: result.asErr.toString() };
      }

      // Execute transaction
      const contractWithSigner = contract!.connect(signer);
      const tx = await contractWithSigner.tx.notifyCounterparty(
        {
          gasLimit: gasRequired,
          storageDepositLimit: storageDeposit.isCharge ? storageDeposit.asCharge : null,
        },
        escrowId,
        notificationType,
        recipientAddress,
        message ? { Some: message } : { None: null },
        type ? { Some: type } : { None: null }
      );

      await new Promise((resolve, reject) => {
        tx.signAndSend(signer, ({ status }) => {
          if (status.isInBlock) {
            resolve(status.asInBlock.toString());
          } else if (status.isError) {
            reject(new Error('Transaction failed'));
          }
        }).catch(reject);
      });

      const notificationResult = result.value.unwrap();

      return {
        success: true,
        notificationId: notificationResult.notification_id,
        message: 'Counterparty notified successfully'
      };

    } catch (error) {
      console.error('Error notifying counterparty:', error);
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to notify counterparty';
      return { success: false, error: errorMessage };
    }
  }, [account, contract, getAccountSigner, validateContractReady]);

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
    isContractReady,
    contract,
    contractError,
    validateContractReady
  };
};