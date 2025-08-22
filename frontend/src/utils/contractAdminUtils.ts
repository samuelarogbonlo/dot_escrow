import { ContractPromise } from '@polkadot/api-contract';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { ESCROW_CONTRACT_ABI, ESCROW_CONTRACT_ADDRESS } from '../contractABI/EscrowABI';
const USDC_TOKEN_ADDRESS = "5EFDb7mKbougLtr5dnwd5KDfZ3wK55JPGPLiryKq4uRMPR46"; // USDC token address

export interface AdminContractCall {
  success: boolean;
  data?: any;
  error?: string;
  transactionHash?: string;
}

/**
 * Set the PSP22 token address used by the escrow contract for payments
 */
export const setUsdtTokenContract = async (
  api: any,
  account: InjectedAccountWithMeta,
  newTokenAddress: string = USDC_TOKEN_ADDRESS
): Promise<AdminContractCall> => {
  try {
    console.log('[Admin] Setting USDT token address:', newTokenAddress);

    const { web3FromAddress } = await import('@polkadot/extension-dapp');
    const injector = await web3FromAddress(account.address);
    api.setSigner(injector.signer);

    const contract = new ContractPromise(api, ESCROW_CONTRACT_ABI, ESCROW_CONTRACT_ADDRESS);

    const gasLimit: any = api.registry.createType('WeightV2', {
      refTime: 3000000000,
      proofSize: 256 * 1024
    });

    // Create AccountId for the new token address
    const tokenAccountId = api.createType('AccountId', newTokenAddress);

    const tx = contract.tx.setUsdtToken(
      {
        gasLimit,
        storageDepositLimit: null,
      },
      tokenAccountId
    );

    return new Promise((resolve) => {
      let resolved = false;

      tx.signAndSend(account.address, (result) => {
        if (resolved) return;

        console.log('[Admin] Transaction status:', result.status.type);

        if (result.dispatchError) {
          console.error('[Admin] Transaction failed:', result.dispatchError.toString());
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
          console.log('[Admin] Transaction finalized');
          console.log('[Admin] Block hash:', result.status.asFinalized.toHex());

          resolved = true;
          resolve({
            success: true,
            transactionHash: result.txHash.toHex(),
            data: {
              txHash: result.txHash.toHex(),
              blockHash: result.status.asFinalized.toHex(),
              newTokenAddress: newTokenAddress
            }
          });
        }
      }).catch((error) => {
        console.error('[Admin] Transaction error:', error);
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
    console.error('[Admin] Error setting USDT token:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to set USDT token'
    };
  }
};

/**
 * Get the current PSP22 token address used by the escrow contract
 */
export const getUsdtTokenContract = async (
  api: any,
  account: InjectedAccountWithMeta
): Promise<AdminContractCall> => {
  try {
    console.log('[Admin] Getting current USDT token address');

    const contract = new ContractPromise(api, ESCROW_CONTRACT_ABI, ESCROW_CONTRACT_ADDRESS);

    const gasLimit: any = api.registry.createType('WeightV2', {
      refTime: 1000000000,
      proofSize: 64 * 1024
    });

    const result = await contract.query.getUsdtToken(
      account.address,
      {
        gasLimit,
        storageDepositLimit: null,
      }
    );

    console.log('[Admin] Get token address result:', result);

    if (result.result.isOk) {
      const tokenAddress = result.output?.toString();
      console.log('[Admin] Current token address:', tokenAddress);
      
      return {
        success: true,
        data: {
          tokenAddress: tokenAddress
        }
      };
    } else {
      const error = result.result.asErr;
      return {
        success: false,
        error: `Query failed: ${error.toString()}`
      };
    }

  } catch (error) {
    console.error('[Admin] Error getting USDT token:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get USDT token'
    };
  }
};