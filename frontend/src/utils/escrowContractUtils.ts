import { ContractPromise } from '@polkadot/api-contract';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { ESCROW_CONTRACT_ABI, ESCROW_CONTRACT_ADDRESS } from '../contractABI/EscrowABI';

/**
 * Utility function to safely convert timestamps
 * @param timestamp - The timestamp to convert
 * @param defaultValue - Default value if timestamp is invalid
 * @returns A valid timestamp in milliseconds
 */
const safeTimestampConversion = (timestamp: any, defaultValue: number = Date.now()): number => {
  console.log('[safeTimestampConversion] Input:', { timestamp, defaultValue, type: typeof timestamp });
  
  if (!timestamp || timestamp === '0' || timestamp === 0) {
    console.log('[safeTimestampConversion] Using default value:', defaultValue);
    return defaultValue;
  }
  
  const parsed = parseInt(timestamp);
  console.log('[safeTimestampConversion] Parsed:', parsed);
  
  if (isNaN(parsed) || parsed <= 0) {
    console.log('[safeTimestampConversion] Invalid parsed value, using default:', defaultValue);
    return defaultValue;
  }
  
  console.log('[safeTimestampConversion] Returning valid timestamp:', parsed);
  return parsed;
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



const processContractEvents = (result: any, contract: any) => {
  let escrowId = null;

  if (result.events) {
    console.log('[Contract] Processing transaction events...');

    result.events.forEach(({ event }: { event: any }, index: number) => {
      console.log(`[Contract] Event ${index}:`, event.section, event.method);

      if (event.section === 'contracts' && event.method === 'ContractEmitted') {
        const [contractAddress, eventData] = event.data;

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
            console.log('[Contract] Event topics found:', eventRecord.topics);

            // The signature topic should be at index 0
            const signatureTopic = eventRecord.topics[0]?.toHex();
            console.log('[Contract] Signature topic:', signatureTopic);

            // Use the ACTUAL signature topic you're receiving
            const ESCROW_CREATED_SIGNATURE = "0x00457363726f77436f6e74726163743a3a457363726f77437265617465640000";

            if (signatureTopic === ESCROW_CREATED_SIGNATURE) {
              console.log('[Contract] ✅ Confirmed EscrowCreated event!');

              // Extract indexed parameters from topics
              // Topic 0: Event signature (EscrowContract::EscrowCreated)
              // Topic 1: escrow_id (indexed String)
              // Topic 2: creator (indexed AccountId)  
              // Topic 3: counterparty (indexed AccountId)

              if (eventRecord.topics.length >= 2) {
                const escrowIdTopic = eventRecord.topics[1];
                console.log('[Contract] Raw escrow_id topic:', escrowIdTopic.toHex());

                try {
                  // For ink! contracts, indexed String parameters are often encoded directly
                  // if they're short enough, or hashed if they're too long

                  const escrowIdHex = escrowIdTopic.toHex();
                  console.log('[Contract] Escrow ID hex:', escrowIdHex);

                  // Remove 0x prefix and try to decode as UTF-8
                  const hexWithoutPrefix = escrowIdHex.replace('0x', '');

                  // Try to decode as string (remove trailing zeros)
                  let decodedString = '';
                  for (let i = 0; i < hexWithoutPrefix.length; i += 2) {
                    const byte = parseInt(hexWithoutPrefix.substr(i, 2), 16);
                    if (byte === 0) break; // Stop at null terminator
                    decodedString += String.fromCharCode(byte);
                  }

                  console.log('[Contract] Decoded escrow ID:', decodedString);

                  if (decodedString && decodedString.length > 0 && decodedString.length < 50) {
                    escrowId = decodedString;
                    console.log('[Contract] ✅ Successfully extracted escrow_id from topic:', escrowId);
                  } else {
                    // For longer strings or if decode fails, use a different approach
                    console.log('[Contract] String might be hashed or encoded differently');

                    // Try using Polkadot.js codec to decode
                    try {
                      // You might need to import proper types for this
                      const codec = new Uint8Array(Buffer.from(hexWithoutPrefix, 'hex'));
                      const decoded = new TextDecoder().decode(codec).replace(/\0/g, '');
                      if (decoded && decoded.length > 0) {
                        escrowId = decoded;
                        console.log('[Contract] ✅ Decoded with TextDecoder:', escrowId);
                      }
                    } catch (codecError) {
                      console.log('[Contract] TextDecoder failed, using hex as fallback');
                      escrowId = escrowIdHex;
                    }
                  }

                } catch (decodeError) {
                  console.error('[Contract] Failed to decode escrow_id from topic:', decodeError);
                  escrowId = escrowIdTopic.toHex();
                }
              }

              // Extract creator and counterparty if needed
              if (eventRecord.topics.length >= 3) {
                const creatorTopic = eventRecord.topics[2];
                console.log('[Contract] Creator AccountId:', creatorTopic.toHex());
              }

              if (eventRecord.topics.length >= 4) {
                const counterpartyTopic = eventRecord.topics[3];
                console.log('[Contract] Counterparty AccountId:', counterpartyTopic.toHex());
              }

              // Try to decode the non-indexed data for additional info
              try {
                console.log('[Contract] Attempting to decode non-indexed event data...');

                // For ink! contracts, you might need to use a different decoding method
                // The eventData might contain the non-indexed parameters directly
                console.log('[Contract] Raw event data:', eventData);

                // Try different decoding approaches
                if (typeof eventData === 'object' && eventData.toHuman) {
                  const humanReadable = eventData.toHuman();
                  console.log('[Contract] Human readable event data:', humanReadable);
                }

                if (typeof eventData === 'object' && eventData.toJSON) {
                  const jsonData = eventData.toJSON();
                  console.log('[Contract] JSON event data:', jsonData);
                }

              } catch (eventDecodeError: any) {
                console.log('[Contract] Could not decode non-indexed data:', eventDecodeError.message);
              }

            } else {
              console.log('[Contract] Not an EscrowCreated event');
              console.log('[Contract] Expected:', ESCROW_CREATED_SIGNATURE);
              console.log('[Contract] Received:', signatureTopic);

              // Try to decode the signature to see what event it actually is
              try {
                const hexWithoutPrefix = signatureTopic.replace('0x', '');
                let eventName = '';
                for (let i = 0; i < hexWithoutPrefix.length; i += 2) {
                  const byte = parseInt(hexWithoutPrefix.substr(i, 2), 16);
                  if (byte === 0) break;
                  eventName += String.fromCharCode(byte);
                }
                console.log('[Contract] Decoded event name:', eventName);
              } catch (e) {
                console.log('[Contract] Could not decode event signature');
              }
            }
          } else {
            console.log('[Contract] No topics found in event record');

            // Fallback for events without topics
            try {
              console.log('[Contract] Trying to decode event data directly...');
              console.log('[Contract] Event data type:', typeof eventData);
              console.log('[Contract] Event data:', eventData);

              if (contract && contract.abi && contract.abi.decodeEvent) {
                const decodedEvent = contract.abi.decodeEvent(eventData);
                console.log('[Contract] Decoded event:', decodedEvent);

                if (decodedEvent && decodedEvent.event && decodedEvent.event.identifier === 'EscrowCreated') {
                  const eventArgs = decodedEvent.args;
                  if (eventArgs && eventArgs.length > 0) {
                    escrowId = eventArgs[0]?.toString();
                    console.log('[Contract] Extracted escrowId from fallback method:', escrowId);
                  }
                }
              }
            } catch (fallbackError: any) {
              console.log('[Contract] Fallback decode failed:', fallbackError.message);
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
      deadline: milestone.deadline
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

    const tx = contract.tx.createEscrow(
      {
        gasLimit,
        storageDepositLimit: null,
      },
      userAccountId,
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

          // Try both methods to extract escrow ID
          let escrowId: any = processContractEvents(result, contract);

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
            createdAt: safeTimestampConversion(data.createdAt || data.created_at, Math.floor(Date.now() / 1000)),
            milestones: data.milestones?.map((m: any) => ({
              id: m.id,
              description: m.description,
              amount: m.amount,
              status: m.status,
              deadline: safeTimestampConversion(m.deadline, Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000)), // Default to 30 days from now if missing
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
      refTime: 5000000000,  // 2 billion ref time units (more for list operations)
      proofSize: 2256 * 1024 // 128KB proof size (more for list operations)
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

      // The output should be a Result<Vec<EscrowData>, EscrowError>
      if (output && typeof output === 'object') {
        // Check if it's a successful result
        if ('Ok' in output && Array.isArray(output.Ok)) {
          const escrowsData = output.Ok as any[];

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
                const [contractAddress, eventData] = event.data;
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
                const [contractAddress, eventData] = event.data;
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
