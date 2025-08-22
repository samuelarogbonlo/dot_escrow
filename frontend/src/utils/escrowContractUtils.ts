import { ContractPromise } from '@polkadot/api-contract';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { ESCROW_CONTRACT_ABI, ESCROW_CONTRACT_ADDRESS } from '../contractABI/EscrowABI';

/**
 * Utility function to safely convert timestamps from smart contract
 * @param timestamp - The timestamp to convert (could be seconds or milliseconds)
 * @param defaultValue - Default value if timestamp is invalid
 * @returns A valid timestamp in milliseconds
 */
const safeTimestampConversion = (timestamp: any, defaultValue: number = Date.now()): number => {
  console.log('[safeTimestampConversion] Input:', { timestamp, defaultValue, type: typeof timestamp });
  
  // Only reject null, undefined, empty string, or explicitly "0"
  if (timestamp == null || timestamp === '' || timestamp === '0' || timestamp === 0) {
    console.log('[safeTimestampConversion] Using default value for null/empty:', defaultValue);
    return defaultValue;
  }
  
  // Convert to string first to handle both string and number inputs
  const timestampStr = timestamp.toString().trim();
  
  // Handle comma-separated numbers (from polkadot.js formatting)
  const cleanTimestamp = timestampStr.replace(/,/g, '');
  
  const parsed = parseInt(cleanTimestamp, 10);
  console.log('[safeTimestampConversion] Parsed:', parsed);
  
  if (isNaN(parsed)) {
    console.log('[safeTimestampConversion] Invalid number, using default:', defaultValue);
    return defaultValue;
  }
  
  // The smart contract uses block_timestamp() which returns milliseconds
  // So we should use the timestamp as-is in most cases
  let finalTimestamp = parsed;
  
  // Only convert if it's clearly in seconds format (very small numbers)
  // For ink! contracts, block_timestamp() returns milliseconds since Unix epoch
  // If the number is less than a reasonable millisecond timestamp, it might be seconds
  if (parsed > 0 && parsed < 946684800000) { // Before year 2000 in milliseconds
    // This might be in seconds, convert to milliseconds
    finalTimestamp = parsed * 1000;
    console.log('[safeTimestampConversion] Converted from seconds to milliseconds:', finalTimestamp);
  }
  
  // Validate the final timestamp is reasonable (after 1970 and before year 2100)
  const minTimestamp = 0; // Jan 1, 1970
  const maxTimestamp = 4102444800000; // Jan 1, 2100
  
  if (finalTimestamp < minTimestamp || finalTimestamp > maxTimestamp) {
    console.log('[safeTimestampConversion] Timestamp out of reasonable range, using default:', defaultValue);
    return defaultValue;
  }
  
  console.log('[safeTimestampConversion] Returning valid timestamp:', finalTimestamp);
  return finalTimestamp;
};

/**
 * Smart contract integration for the escrow contract.
 * This file implements real calls to the deployed ink! smart contract.
 */

export interface EscrowContractCall {
  success: boolean;
  data?: any;
  error?: string;
  escrowId?: any
  transactionHash?: string;
}

export interface Milestone {
  id: string;
  description: string;
  amount: string;
  status: 'Pending' | 'InProgress' | 'Completed' | 'Disputed' | 'Overdue';
  deadline: number;
}

export interface EscrowData {
  id: string;
  creatorAddress: string;
  counterpartyAddress: string;
  counterpartyType: string;
  title: string;
  description: string;
  totalAmount: string;
  status: string;
  milestones: Milestone[];
  createdAt: number;
  transactionHash?: string;
}



const processContractEvents = (result: any, _contract: any) => {
  let escrowId: string | null = null;

  if (result.events) {
    console.log('[Contract] Processing transaction events...');

    result.events.forEach(({ event }: { event: any }, index: number) => {
      console.log(`[Contract] Event ${index}:`, event.section, event.method);

      if (event.section === 'contracts' && event.method === 'ContractEmitted') {
        const [contractAddress] = event.data;

        console.log('[Contract] Contract event found!');
        console.log('[Contract] Contract address:', contractAddress.toString());

        // Check if this event is from our escrow contract
        if (contractAddress.toString() === ESCROW_CONTRACT_ADDRESS) {
          console.log('[Contract] Event is from our escrow contract!');

          // Get the raw event record which contains topics
          const eventRecord = result.events[index];
          console.log('[Contract] Full event record:', eventRecord);

          // Extract topics if available
          if (eventRecord.topics && eventRecord.topics.length > 0) {
            console.log('[Contract] Event topics found:', eventRecord.topics.length);

            // For ink! events, try to decode the topics as simple strings
            // The smart contract generates IDs like "escrow_1", "escrow_2", etc.
            if (eventRecord.topics.length >= 2) {
              const escrowIdTopic = eventRecord.topics[1];
              console.log('[Contract] Raw escrow_id topic:', escrowIdTopic.toHex());

              try {
                // Simple approach: decode hex to ASCII string
                const escrowIdHex = escrowIdTopic.toHex();
                const hexWithoutPrefix = escrowIdHex.replace('0x', '');

                // Decode hex to string
                let decodedString = '';
                for (let i = 0; i < hexWithoutPrefix.length; i += 2) {
                  const byte = parseInt(hexWithoutPrefix.substr(i, 2), 16);
                  if (byte === 0) break; // Stop at null terminator
                  if (byte >= 32 && byte <= 126) { // Only printable ASCII characters
                    decodedString += String.fromCharCode(byte);
                  }
                }

                console.log('[Contract] Decoded escrow ID:', decodedString);

                // Validate it looks like an escrow ID (escrow_N format)
                if (decodedString && decodedString.match(/^escrow_\d+$/)) {
                  escrowId = decodedString;
                  console.log('[Contract] ✅ Successfully extracted escrow_id:', escrowId);
                }

              } catch (decodeError) {
                console.error('[Contract] Failed to decode escrow_id from topic:', decodeError);
              }
            }
          }

          // If we couldn't extract from topics, try alternative approaches
          if (!escrowId) {
            console.log('[Contract] Could not extract escrowId from topics, trying alternatives...');

            // Alternative 1: Use transaction hash as escrowId (reliable fallback)
            if (result.txHash) {
              escrowId = `tx_${result.txHash.toHex().slice(2, 10)}`; // Use first 8 chars of tx hash
              console.log('[Contract] Using transaction hash as escrowId:', escrowId);
            }

            // Alternative 2: Generate a predictable ID based on block and timestamp
            if (!escrowId && result.status?.isFinalized) {
              const blockHash = result.status.asFinalized.toHex();
              escrowId = `block_${blockHash.slice(2, 10)}`;
              console.log('[Contract] Using block hash as escrowId:', escrowId);
            }
          }
        }
      }
    });
  }

  console.log('[Contract] Final extracted escrowId:', escrowId);
  return escrowId;
};
/**
 * Create a new escrow using the smart contract - Simplified Method 1 Only
 */
export const createEscrowContract = async (
  api: any,
  account: InjectedAccountWithMeta,
  creatorAddress: string,
  counterpartyAddress: string,
  counterpartyType: string,
  status: string,
  title: string,
  description: string,
  totalAmount: string,
  milestones: Milestone[],
  transactionHash?: string,
): Promise<EscrowContractCall> => {
  try {
    // ... [previous setup code remains the same] ...

    const contractMilestones = milestones.map(milestone => ({
      id: milestone.id,
      description: milestone.description,
      amount: milestone.amount,
      status: milestone.status,
      deadline: milestone.deadline,
      completed_at: null,
      dispute_reason: null,
      dispute_filed_by: null
    }));

    const { web3FromAddress } = await import('@polkadot/extension-dapp');
    const injector = await web3FromAddress(account.address);
    api.setSigner(injector.signer);

    const contract = new ContractPromise(api, ESCROW_CONTRACT_ABI, ESCROW_CONTRACT_ADDRESS);

    const gasLimit: any = api.registry.createType('WeightV2', {
      refTime: 3000000000,
      proofSize: 256 * 1024
    });

    let userAccountId: any;
    let counterpartyAccountId: any;

    try {
      userAccountId = api.createType('AccountId', creatorAddress);
      counterpartyAccountId = api.createType('AccountId', counterpartyAddress);
    } catch (error) {
      console.error('[Contract] Invalid address format:', error);
      return {
        success: false,
        error: `Invalid address format: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }

    console.log('[Contract] Creating escrow with params:', {
      userAccountId: userAccountId.toString(),
      counterpartyAccountId: counterpartyAccountId.toString(),
      counterpartyType,
      status,
      title,
      description,
      totalAmount,
      contractMilestones,
      transactionHash
    });

    const tx = contract.tx.createEscrow(
      {
        gasLimit,
        storageDepositLimit: null,
      },
      counterpartyAccountId,
      counterpartyType,
      status,
      title,
      description,
      totalAmount,
      contractMilestones,
      transactionHash
    );

    return new Promise((resolve) => {
      let resolved = false;

      tx.signAndSend(account.address, (result) => {
        if (resolved) return;

        console.log('[Contract] Transaction status:', result.status.type);

        if (result.dispatchError) {
          console.error('[Contract] Transaction failed:', result.dispatchError.toString());
          if (!resolved) {
            resolved = true;
            resolve({
              success: false,
              error: `Transaction failed: ${result.dispatchError.toString()}`
            });
          }
          return;
        }

        if (result.status.isFinalized) {
          console.log('[Contract] Transaction finalized');
          console.log('[Contract] Block hash:', result.status.asFinalized.toHex());

          // Check if transaction was successful by looking for dispatchError
          if (result.dispatchError) {
            console.error('[Contract] Dispatch error in finalized transaction:', result.dispatchError);
            resolved = true;
            resolve({
              success: false,
              error: `Transaction failed: ${result.dispatchError}`
            });
            return;
          }

          // Check contract events to see if there were any contract-level errors
          const contractEvents = result.events?.filter((event: any) => 
            event.event?.section === 'contracts'
          );
          console.log('[Contract] Contract events:', contractEvents);

          // Try both methods to extract escrow ID
          let escrowId: any = processContractEvents(result, contract);

          console.log('[Contract] Escrow creation result:', {
            success: true,
            transactionHash: result.txHash.toHex(),
            escrowId: escrowId,
            allEvents: result.events?.map((e: any) => `${e.event?.section}.${e.event?.method}`)
          });

          resolved = true;
          resolve({
            success: true,
            transactionHash: result.txHash.toHex(),
            escrowId: escrowId,
          });
        }
      }).catch((error) => {
        console.error('[Contract] Transaction error:', error);
        if (!resolved) {
          resolved = true;
          resolve({
            success: false,
            error: error instanceof Error ? error.message : 'Transaction failed'
          });
        }
      });
    });

  } catch (error) {
    console.error('[Contract] Error creating escrow:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create escrow'
    };
  }
};

/**
 * Get escrow details from the smart contract
 */
export const getEscrowContract = async (
  api: any,
  account: InjectedAccountWithMeta,
  escrowId: string
): Promise<EscrowContractCall> => {
  try {
    console.log('[Contract] Getting escrow:', escrowId);

    // Check if API is properly initialized
    if (!api || !api.isConnected) {
      return {
        success: false,
        error: 'Polkadot API is not connected'
      };
    }

    // Create contract instance
    const contract = new ContractPromise(api, ESCROW_CONTRACT_ABI, ESCROW_CONTRACT_ADDRESS);


    // Create proper WeightV2 for gasLimit
    const gasLimit: any = api.registry.createType('WeightV2', {
      refTime: 2000000000,  // 2 billion ref time units (more for list operations)
      proofSize: 128 * 1024 // 128KB proof size (more for list operations)
    });

    // Call the get_escrow function (read-only query)
    const result = await contract.query.getEscrow(
      account.address, // caller address
      {
        gasLimit,
        storageDepositLimit: null,
      },
      escrowId // escrow ID parameter
    );

    console.log('[Contract] Raw query result:', result);

    // Check if the call was successful
    if (result.result.isOk) {
      const output = result.output?.toHuman();
      console.log('[Contract] Decoded output:', output);

      // The output should be a Result<EscrowData, EscrowError>
      if (output && typeof output === 'object') {
        // Check if it's a successful result
        if ('Ok' in output) {
          const escrowData = output.Ok as any;

          const data = escrowData.Ok

          console.log(escrowData.Ok)

          // Transform the data to match our interface
          const transformedData: EscrowData = {
            id: data.id,
            creatorAddress: data.creatorAddress || data.creator_address,
            counterpartyAddress: data.counterpartyAddress || data.counterparty_address,
            counterpartyType: data.counterpartyType || data.counterparty_type,
            title: data.title,
            description: data.description,
            totalAmount: data.totalAmount || data.total_amount,
            status: data.status,
            createdAt: safeTimestampConversion(data.createdAt || data.created_at, Date.now()),
            milestones: data.milestones?.map((m: any) => ({
              id: m.id,
              description: m.description,
              amount: m.amount,
              status: m.status,
              deadline: safeTimestampConversion(m.deadline, Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000)), // Default to 30 days from now if missing // Default to 30 days from now if missing
              completedAt: m.completedAt ? safeTimestampConversion(m.completedAt) : undefined,
              disputeReason: m.disputeReason || m.dispute_reason,
              disputeFiledBy: m.disputeFiledBy || m.dispute_filed_by
            })) || [],
            transactionHash: data.transactionHash || data.transaction_hash
          };

          return {
            success: true,
            data: transformedData
          };
        } else if ('Err' in output) {
          // Handle contract error
          return {
            success: false,
            error: `Contract error: ${JSON.stringify(output.Err)}`
          };
        }
      }

      return {
        success: true,
        data: output
      };
    } else {
      // Handle query execution error
      const error = result.result.asErr;
      console.error('[Contract] Query execution failed:', error);

      return {
        success: false,
        error: `Query failed: ${error.toString()}`
      };
    }

  } catch (error) {
    console.error('[Contract] Error getting escrow:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get escrow'
    };
  }
};

/**
 * List all escrows from the smart contract
 */
export const listEscrowsContract = async (
  api: any,
  account: InjectedAccountWithMeta
): Promise<EscrowContractCall> => {
  try {
    console.log('[Contract] Listing escrows for account:', account.address);

    // Check if API is properly initialized
    if (!api || !api.isConnected) {
      return {
        success: false,
        error: 'Polkadot API is not connected'
      };
    }

    // Create contract instance
    const contract = new ContractPromise(api, ESCROW_CONTRACT_ABI, ESCROW_CONTRACT_ADDRESS);

    // Create proper WeightV2 for gasLimit
    const gasLimit: any = api.registry.createType('WeightV2', {
      refTime: 5000000000,  // 5 billion ref time units (more for list operations)
      proofSize: 256 * 1024 // 256KB proof size (more for list operations)
    });

    // Call the list_escrows function (read-only query)
    const result = await contract.query.listEscrows(
      account.address, // caller address
      {
        gasLimit,
        storageDepositLimit: null,
      }
      // No parameters needed for list_escrows
    );

    console.log('[Contract] Raw list query result:', result);

    // Check if the call was successful
    if (result.result.isOk) {
      const output = result.output?.toHuman();
      console.log('[Contract] Decoded list output:', output);
      console.log('[Contract] Output type:', typeof output);
      console.log('[Contract] Output keys:', output ? Object.keys(output) : 'null');

      // The output should be a Result<Vec<EscrowData>, EscrowError>
      if (output && typeof output === 'object') {
        // Check if it's a successful result
        if ('Ok' in output) {
          console.log('[Contract] Found Ok in output, value:', output.Ok);
          
          // Handle nested Result structure: Result<Result<Vec<EscrowData>, EscrowError>, InkError>
          if (output.Ok && typeof output.Ok === 'object' && 'Ok' in output.Ok) {
            console.log('[Contract] Found nested Ok, extracting inner array:', output.Ok.Ok);
            const escrowsData = output.Ok.Ok as any[];

            // Transform the data array to match our interface
            const transformedData: EscrowData[] = escrowsData.map((escrowData: any) => ({
              id: escrowData.id,
              creatorAddress: escrowData.creatorAddress || escrowData.creator_address,
              counterpartyAddress: escrowData.counterpartyAddress || escrowData.counterparty_address,
              counterpartyType: escrowData.counterpartyType || escrowData.counterparty_type,
              title: escrowData.title,
              description: escrowData.description,
              totalAmount: escrowData.totalAmount || escrowData.total_amount,
              status: escrowData.status,
              createdAt: safeTimestampConversion(escrowData.createdAt || escrowData.created_at, Math.floor(Date.now() / 1000)),
              milestones: escrowData.milestones?.map((m: any) => ({
                id: m.id,
                description: m.description,
                amount: m.amount,
                status: m.status,
                deadline: safeTimestampConversion(m.deadline, Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000)), // Default to 30 days from now if missing
                completedAt: m.completedAt ? safeTimestampConversion(m.completedAt) : undefined,
                disputeReason: m.disputeReason || m.dispute_reason,
                disputeFiledBy: m.disputeFiledBy || m.dispute_filed_by
              })) || [],
              transactionHash: escrowData.transactionHash || escrowData.transaction_hash
            }));

            return {
              success: true,
              data: transformedData
            };
          } else if ('Ok' in output && Array.isArray(output.Ok)) {
            // Direct array format (old structure compatibility)
            const escrowsData = output.Ok as any[];

            const transformedData: EscrowData[] = escrowsData.map((escrowData: any) => ({
              id: escrowData.id,
              creatorAddress: escrowData.creatorAddress || escrowData.creator_address,
              counterpartyAddress: escrowData.counterpartyAddress || escrowData.counterparty_address,
              counterpartyType: escrowData.counterpartyType || escrowData.counterparty_type,
              title: escrowData.title,
              description: escrowData.description,
              totalAmount: escrowData.totalAmount || escrowData.total_amount,
              status: escrowData.status,
              createdAt: safeTimestampConversion(escrowData.createdAt || escrowData.created_at, Math.floor(Date.now() / 1000)),
              milestones: escrowData.milestones?.map((m: any) => ({
                id: m.id,
                description: m.description,
                amount: m.amount,
                status: m.status,
                deadline: safeTimestampConversion(m.deadline, Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000)), // Default to 30 days from now if missing
                completedAt: m.completedAt ? safeTimestampConversion(m.completedAt) : undefined,
                disputeReason: m.disputeReason || m.dispute_reason,
                disputeFiledBy: m.disputeFiledBy || m.dispute_filed_by
              })) || [],
              transactionHash: escrowData.transactionHash || escrowData.transaction_hash
            }));

            return {
              success: true,
              data: transformedData
            };
          } else if ('Ok' in output && !Array.isArray(output.Ok)) {
            // If Ok but not an array, might be empty result
            return {
              success: true,
              data: []
            };
          } else if ('Err' in output) {
            // Handle contract error
            return {
              success: false,
              error: `Contract error: ${JSON.stringify(output.Err)}`
            };
          }
        } else if ('Err' in output) {
          // Handle outer error
          return {
            success: false,
            error: `Contract error: ${JSON.stringify(output.Err)}`
          };
        }
      }

      // Fallback: return raw output
      return {
        success: true,
        data: Array.isArray(output) ? output : []
      };
    } else {
      // Handle query execution error
      const error = result.result.asErr;
      console.error('[Contract] List query execution failed:', error);

      return {
        success: false,
        error: `Query failed: ${error.toString()}`
      };
    }

  } catch (error) {
    console.error('[Contract] Error listing escrows:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list escrows'
    };
  }
};
/**
 * Update escrow status using the smart contract
 */
export const updateEscrowStatusContract = async (
  api: any,
  account: InjectedAccountWithMeta,
  escrowId: string,
  newStatus: string,
  transactionHash?: string
): Promise<EscrowContractCall> => {
  try {
    console.log('[Contract] Updating escrow status:', { escrowId, newStatus, transactionHash });

    const { web3FromAddress } = await import('@polkadot/extension-dapp');
    const injector = await web3FromAddress(account.address);
    api.setSigner(injector.signer);

    const contract = new ContractPromise(api, ESCROW_CONTRACT_ABI, ESCROW_CONTRACT_ADDRESS);

    const gasLimit: any = api.registry.createType('WeightV2', {
      refTime: 3000000000,
      proofSize: 256 * 1024
    });

    // According to ABI: update_escrow_status(escrow_id: String, new_status: String, transaction_hash: Option<String>)
    const tx = contract.tx.updateEscrowStatus(
      {
        gasLimit,
        storageDepositLimit: null,
      },
      escrowId,           // escrow_id: String
      newStatus,          // new_status: String  
      transactionHash || null  // transaction_hash: Option<String>
    );

    return new Promise((resolve) => {
      let resolved = false;

      tx.signAndSend(account.address, (result) => {
        if (resolved) return;

        console.log('[Contract] Transaction status:', result.status.type);

        if (result.dispatchError) {
          console.error('[Contract] Transaction failed:', result.dispatchError.toString());
          if (!resolved) {
            resolved = true;
            resolve({
              success: false,
              error: `Transaction failed: ${result.dispatchError.toString()}`
            });
          }
          return;
        }

        if (result.status.isFinalized) {
          console.log('[Contract] Transaction finalized');
          console.log('[Contract] Block hash:', result.status.asFinalized.toHex());

          resolved = true;
          resolve({
            success: true,
            transactionHash: result.txHash.toHex(),
            data: {
              txHash: result.txHash.toHex(),
              blockHash: result.status.asFinalized.toHex()
            }
          });
        }
      }).catch((error) => {
        console.error('[Contract] Transaction error:', error);
        if (!resolved) {
          resolved = true;
          resolve({
            success: false,
            error: error instanceof Error ? error.message : 'Transaction failed'
          });
        }
      });
    });

  } catch (error) {
    console.error('[Contract] Error updating escrow status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update escrow status'
    };
  }
};

/**
 * Update milestone status using the smart contract
 */
export const updateMilestoneStatusContract = async (
  api: any,
  account: InjectedAccountWithMeta,
  escrowId: string,
  milestone: Milestone,
  newStatus: string
): Promise<EscrowContractCall> => {
  try {
    console.log('[Contract] Updating milestone status:', {
      escrowId,
      milestoneId: milestone.id,
      currentStatus: milestone.status,
      newStatus
    });

    const { web3FromAddress } = await import('@polkadot/extension-dapp');
    const injector = await web3FromAddress(account.address);
    api.setSigner(injector.signer);

    const contract = new ContractPromise(api, ESCROW_CONTRACT_ABI, ESCROW_CONTRACT_ADDRESS);

    const gasLimit: any = api.registry.createType('WeightV2', {
      refTime: 3000000000,
      proofSize: 256 * 1024
    });

    // Create and send the transaction
    const result = await new Promise<any>((resolve, reject) => {
      contract.tx.updateEscrowMilestoneStatus(
        {
          gasLimit: gasLimit,
          storageDepositLimit: null, // Let the runtime calculate
        },
        escrowId,
        milestone,
        newStatus
      )
        .signAndSend(account.address, (result) => {
          console.log('[Contract] Transaction status:', result.status.type);

          if (result.status.isInBlock) {
            console.log('[Contract] Transaction included in block:', result.status.asInBlock.toHex());
          } else if (result.status.isFinalized) {
            console.log('[Contract] Transaction finalized in block:', result.status.asFinalized.toHex());

            // Check for contract events
            const contractEvents = result.events?.filter(({ event }) =>
              event.section === 'contracts' && event.method === 'ContractEmitted'
            );

            if (contractEvents && contractEvents.length > 0) {
              console.log('[Contract] Contract events found:', contractEvents.length);

              // Look for MilestoneStatusChanged event
              contractEvents.forEach(({ event }, index) => {
                const [contractAddress] = event.data;

                if (contractAddress.toString() === ESCROW_CONTRACT_ADDRESS) {
                  console.log(`[Contract] Event ${index} from our contract:`, event);

                  // Try to extract event details
                  try {
                    // Check if this is a MilestoneStatusChanged event                  
                    // Note: You might need to check topics differently based on how events are structured
                    console.log('[Contract] Milestone status change event detected');
                  } catch (eventError) {
                    console.log('[Contract] Could not parse event:', eventError);
                  }
                }
              });
            }

            resolve({
              success: true,
              transactionHash: result.txHash?.toHex(),
              blockHash: result.status.asFinalized.toHex(),
              events: result.events,
              data: {
                txHash: result.txHash?.toHex(),
                blockHash: result.status.asFinalized.toHex()
              }
            });
          } else if (result.status.isInvalid) {
            reject(new Error('Transaction is invalid'));
          } else if (result.dispatchError) {
            if (result.dispatchError.isModule) {
              const decoded = api.registry.findMetaError(result.dispatchError.asModule);
              reject(new Error(`Transaction failed: ${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`));
            } else {
              reject(new Error(`Transaction failed: ${result.dispatchError.toString()}`));
            }
          }
        });
    });

    console.log('[Contract] ✅ Milestone status updated successfully');
    return result;

  } catch (error) {
    console.error('[Contract] Error updating milestone status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update milestone status'
    };
  }
};


/**
 * Dispute milestone using the smart contract
 */
export const disputeMilestoneContract = async (
  api: any,
  account: InjectedAccountWithMeta,
  escrowId: string,
  milestoneId: string,
  reason: string
): Promise<EscrowContractCall> => {
  try {
    console.log('[Contract] Disputing milestone:', { escrowId, milestoneId, reason });

    const { web3FromAddress } = await import('@polkadot/extension-dapp');
    const injector = await web3FromAddress(account.address);
    api.setSigner(injector.signer);

    const contract = new ContractPromise(api, ESCROW_CONTRACT_ABI, ESCROW_CONTRACT_ADDRESS);

    const gasLimit: any = api.registry.createType('WeightV2', {
      refTime: 3000000000,
      proofSize: 256 * 1024
    });

    // According to ABI: dispute_milestone(escrow_id: String, milestone_id: String, reason: String)
    const tx = contract.tx.disputeMilestone(
      {
        gasLimit,
        storageDepositLimit: null,
      },
      escrowId,     // escrow_id: String
      milestoneId,  // milestone_id: String
      reason        // reason: String
    );

    return new Promise((resolve) => {
      let resolved = false;

      tx.signAndSend(account.address, (result) => {
        if (resolved) return;

        console.log('[Contract] Transaction status:', result.status.type);

        if (result.dispatchError) {
          console.error('[Contract] Transaction failed:', result.dispatchError.toString());
          if (!resolved) {
            resolved = true;
            resolve({
              success: false,
              error: `Transaction failed: ${result.dispatchError.toString()}`
            });
          }
          return;
        }

        if (result.status.isFinalized) {
          console.log('[Contract] Transaction finalized');
          console.log('[Contract] Block hash:', result.status.asFinalized.toHex());

          // Process contract events to get dispute_id from MilestoneDisputed event
          let disputeId = null;
          if (result.events) {
            result.events.forEach(({ event }) => {
              if (event.section === 'contracts' && event.method === 'ContractEmitted') {
                const [contractAddress] = event.data;
                if (contractAddress.toString() === ESCROW_CONTRACT_ADDRESS) {
                  // Try to extract dispute_id from the MilestoneDisputed event
                  // This would need proper event decoding based on your event structure
                  console.log('[Contract] MilestoneDisputed event detected');
                }
              }
            });
          }

          resolved = true;
          resolve({
            success: true,
            transactionHash: result.txHash.toHex(),
            data: {
              txHash: result.txHash.toHex(),
              blockHash: result.status.asFinalized.toHex(),
              disputeId: disputeId
            }
          });
        }
      }).catch((error) => {
        console.error('[Contract] Transaction error:', error);
        if (!resolved) {
          resolved = true;
          resolve({
            success: false,
            error: error instanceof Error ? error.message : 'Transaction failed'
          });
        }
      });
    });

  } catch (error) {
    console.error('[Contract] Error disputing milestone:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to dispute milestone'
    };
  }
};


export const releaseMilestoneContract = async (
  api: any,
  account: InjectedAccountWithMeta,
  escrowId: string,
  milestoneId: string
): Promise<EscrowContractCall> => {
  try {
    console.log('[Contract] Releasing milestone:', { escrowId, milestoneId });

    const { web3FromAddress } = await import('@polkadot/extension-dapp');
    const injector = await web3FromAddress(account.address);
    api.setSigner(injector.signer);

    const contract = new ContractPromise(api, ESCROW_CONTRACT_ABI, ESCROW_CONTRACT_ADDRESS);

    const gasLimit: any = api.registry.createType('WeightV2', {
      refTime: 3000000000,
      proofSize: 256 * 1024
    });

    // According to ABI: release_milestone(escrow_id: String, milestone_id: String)
    const tx = contract.tx.releaseMilestone(
      {
        gasLimit,
        storageDepositLimit: null,
      },
      escrowId,     // escrow_id: String
      milestoneId   // milestone_id: String
    );

    return new Promise((resolve) => {
      let resolved = false;

      tx.signAndSend(account.address, (result) => {
        if (resolved) return;

        console.log('[Contract] Transaction status:', result.status.type);

        if (result.dispatchError) {
          console.error('[Contract] Transaction failed:', result.dispatchError.toString());
          if (!resolved) {
            resolved = true;
            resolve({
              success: false,
              error: `Transaction failed: ${result.dispatchError.toString()}`
            });
          }
          return;
        }

        if (result.status.isFinalized) {
          console.log('[Contract] Transaction finalized');
          console.log('[Contract] Block hash:', result.status.asFinalized.toHex());

          // Process contract events to get release details from MilestoneReleased event
          let releaseData = null;
          if (result.events) {
            result.events.forEach(({ event }) => {
              if (event.section === 'contracts' && event.method === 'ContractEmitted') {
                const [contractAddress] = event.data;
                if (contractAddress.toString() === ESCROW_CONTRACT_ADDRESS) {
                  // Try to extract release data from the MilestoneReleased event
                  console.log('[Contract] MilestoneReleased event detected');
                }
              }
            });
          }

          resolved = true;
          resolve({
            success: true,
            transactionHash: result.txHash.toHex(),
            data: {
              txHash: result.txHash.toHex(),
              blockHash: result.status.asFinalized.toHex(),
              releaseData: releaseData
            }
          });
        }
      }).catch((error) => {
        console.error('[Contract] Transaction error:', error);
        if (!resolved) {
          resolved = true;
          resolve({
            success: false,
            error: error instanceof Error ? error.message : 'Transaction failed'
          });
        }
      });
    });

  } catch (error) {
    console.error('[Contract] Error releasing milestone:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to release milestone'
    };
  }
};

/**
 * Notify counterparty using the smart contract - CORRECTED
 */
export const notifyCounterpartyContract = async (
  api: any,
  account: InjectedAccountWithMeta,
  escrowId: string,
  notificationType: string,
  recipientAddress: string,
  message?: string,
  notificationKind?: string
): Promise<EscrowContractCall> => {
  try {
    console.log('[Contract] Notifying counterparty:', { 
      escrowId, 
      notificationType, 
      recipientAddress, 
      message, 
      notificationKind 
    });

    const { web3FromAddress } = await import('@polkadot/extension-dapp');
    const injector = await web3FromAddress(account.address);
    api.setSigner(injector.signer);

    const contract = new ContractPromise(api, ESCROW_CONTRACT_ABI, ESCROW_CONTRACT_ADDRESS);

    const gasLimit: any = api.registry.createType('WeightV2', {
      refTime: 3000000000,
      proofSize: 256 * 1024
    });

    // Create AccountId for recipient_address
    const recipientAccountId = api.createType('AccountId', recipientAddress);

    // According to ABI: notify_counterparty(
    //   escrow_id: String, 
    //   notification_type: String, 
    //   recipient_address: AccountId, 
    //   _message: Option<String>, 
    //   _notification_kind: Option<String>
    // )
    const tx = contract.tx.notifyCounterparty(
      {
        gasLimit,
        storageDepositLimit: null,
      },
      escrowId,                    // escrow_id: String
      notificationType,            // notification_type: String
      recipientAccountId,          // recipient_address: AccountId
      message || null,             // _message: Option<String>
      notificationKind || null     // _notification_kind: Option<String>
    );

    return new Promise((resolve) => {
      let resolved = false;

      tx.signAndSend(account.address, (result) => {
        if (resolved) return;

        console.log('[Contract] Transaction status:', result.status.type);

        if (result.dispatchError) {
          console.error('[Contract] Transaction failed:', result.dispatchError.toString());
          if (!resolved) {
            resolved = true;
            resolve({
              success: false,
              error: `Transaction failed: ${result.dispatchError.toString()}`
            });
          }
          return;
        }

        if (result.status.isFinalized) {
          console.log('[Contract] Transaction finalized');
          console.log('[Contract] Block hash:', result.status.asFinalized.toHex());

          // Process contract events to get notification_id from CounterpartyNotified event
          let notificationId = null;
          if (result.events) {
            result.events.forEach(({ event }) => {
              if (event.section === 'contracts' && event.method === 'ContractEmitted') {
                const [contractAddress] = event.data;
                if (contractAddress.toString() === ESCROW_CONTRACT_ADDRESS) {
                  // Try to extract notification_id from the CounterpartyNotified event
                  console.log('[Contract] CounterpartyNotified event detected');
                }
              }
            });
          }

          resolved = true;
          resolve({
            success: true,
            transactionHash: result.txHash.toHex(),
            data: {
              txHash: result.txHash.toHex(),
              blockHash: result.status.asFinalized.toHex(),
              notificationId: notificationId
            }
          });
        }
      }).catch((error) => {
        console.error('[Contract] Transaction error:', error);
        if (!resolved) {
          resolved = true;
          resolve({
            success: false,
            error: error instanceof Error ? error.message : 'Transaction failed'
          });
        }
      });
    });

  } catch (error) {
    console.error('[Contract] Error notifying counterparty:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to notify counterparty'
    };
  }
};
