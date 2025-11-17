import { useCallback } from 'react';
import { ApiPromise } from '@polkadot/api';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { ContractPromise } from '@polkadot/api-contract';
import { ESCROW_CONTRACT_ABI, ESCROW_CONTRACT_ADDRESS } from '../contractABI/EscrowABI';

export interface AdminProposal {
  id: number;
  action: any;
  created_by: string;
  created_at: number;
  approvals: string[];
  executed: boolean;
  executed_at?: number | null;
}

interface UseAdminGovernanceOptions {
  api: ApiPromise | null;
  account: InjectedAccountWithMeta | null;
}

export const estimateGas = async (
  api: any,
  contract: ContractPromise,
  methodName: string,
  account: any,
  args: any[]
): Promise<any> => {
  try {

    // Get the contract query method
    const query = contract.query[methodName];
    if (!query) {
      console.warn(`[GasEstimation] Method ${methodName} not found, using default gas`);
      return api.registry.createType('WeightV2', {
        refTime: 5000000000,
        proofSize: 512 * 1024
      });
    }

    // Perform a dry run to estimate gas
    const { gasRequired, result } = await query(
      account.address,
      {
        gasLimit: api.registry.createType('WeightV2', {
          refTime: 100000000000, // Use high limit for estimation
          proofSize: 5 * 1024 * 1024 // 5MB for estimation
        }),
        storageDepositLimit: null,
      },
      ...args
    );


    if (result.isErr) {
      console.warn(`[GasEstimation] Dry run failed, using safe defaults`);
      return api.registry.createType('WeightV2', {
        refTime: 30000000000, // Increase default gas for complex operations
        proofSize: 2 * 1024 * 1024 // Increase proof size too
      });
    }

    // Add 25% buffer to the estimated gas
    const refTimeBuffer = gasRequired.refTime.toBn().muln(125).divn(100);
    const proofSizeBuffer = gasRequired.proofSize.toBn().muln(125).divn(100);

    // Ensure minimum gas limits
    const minRefTime = 2000000000; // 2 second minimum
    const minProofSize = 512 * 1024; // 512KB minimum

    const finalGasLimit = api.registry.createType('WeightV2', {
      refTime: refTimeBuffer.lt(api.registry.createType('u64', minRefTime))
        ? minRefTime
        : refTimeBuffer.toString(),
      proofSize: proofSizeBuffer.lt(api.registry.createType('u64', minProofSize))
        ? minProofSize
        : proofSizeBuffer.toString()
    });

    return finalGasLimit;

  } catch (error) {
    console.error(`[GasEstimation] Error estimating gas:`, error);
    // Return safe default on error
    return api.registry.createType('WeightV2', {
      refTime: 30000000000, // Higher default
      proofSize: 2 * 1024 * 1024
    });
  }
};

export const useAdminGovernance = ({ api, account }: UseAdminGovernanceOptions) => {
  const getContract = useCallback(() => {
    if (!api) return null;
    return new ContractPromise(api as any, ESCROW_CONTRACT_ABI as any, ESCROW_CONTRACT_ADDRESS);
  }, [api]);

  const isAdminSigner = async (address: string) => {
    const contract = getContract();
    if (!contract || !api || !account) return false;

    console.log("isAdmin Address", address)

    // Dynamically estimate gas for this query
    const gasLimit = await estimateGas(
      api,
      contract,
      'isAdminSigner',
      account,
      [address]
    );


    const { result, output } = await contract.query.isAdminSigner(
      account.address,
      {
        gasLimit,
        storageDepositLimit: null,
      },
      address
    );

    if (result.isOk && output) {
      const humanOutput = (output as any).toHuman?.() ?? (output as any).toJSON?.() ?? (output as any);
      return humanOutput.Ok

    }
    return false;
  };

  const getAdminSigners = useCallback(async () => {
    const contract = getContract();
    if (!contract || !api || !account) return [] as string[];
    const gasLimit = await estimateGas(
      api,
      contract,
      'getAdminSigners',
      account,
      []
    );
    const { result, output } = await contract.query.getAdminSigners(
    account.address,
      {
        gasLimit,
        storageDepositLimit: null
      }
    );
    if (result.isOk && output) {
      const data = (output as any).toJSON?.() ?? (output as any);
      console.log(data)
      return data.ok as string[];
    }
    return [];
  }, [account?.address, getContract]);

  const getSignatureThreshold = useCallback(async () => {
    const contract = getContract();
    if (!contract || !api || !account) return 1;
    const gasLimit = await estimateGas(
      api,
      contract,
      'getSignatureThreshold',
      account,
      []
    );
    const { result, output } = await contract.query.getSignatureThreshold(
      account.address,
      {
        gasLimit,
        storageDepositLimit: null
      }
    );
    if (result.isOk && output) {
      const data = (output as any).toJSON?.() ?? (output as any);
      console.log(data.ok)
      return data.ok;
    }
    return 1;
  }, [account?.address, getContract]);

  const getProposalCounter = useCallback(async () => {
    const contract = getContract();
    if (!contract || !api || !account) return 0;
    const gasLimit = await estimateGas(
      api,
      contract,
      'getProposalCounter',
      account,
      []
    );
    const { result, output } = await contract.query.getProposalCounter(
      account.address,
      {
        gasLimit,
        storageDepositLimit: null,
      }
    );
    if (result.isOk && output) {
      const data = (output as any).toJSON?.() ?? (output as any);
      return data.ok;
    }
    return 0;
  }, [account?.address, getContract]);

  const getProposal = useCallback(async (id: number): Promise<AdminProposal | null> => {
    const contract = getContract();
    if (!contract || !api || !account) return null;
    const gasLimit = await estimateGas(
      api,
      contract,
      'getProposal',
      account,
      [id]
    );
    const { result, output } = await contract.query.getProposal(
      account.address,
      {
        gasLimit,
        storageDepositLimit: null,
      },
      id
    );
    console.log("getting it")
    if (result.isOk && output) {
      const data = (output as any).toJSON?.() ?? (output as any);
      console.log(data.ok)
      return data.ok as AdminProposal;
    }
    return null;
  }, [account?.address, getContract]);

  const listProposals = useCallback(async () => {
    const total = await getProposalCounter();
    console.log(total)
    const items: any[] = [];
    for (let i = 1; i <= total; i++) {
      const proposal = await getProposal(i);
      if (proposal) {
        items.push(proposal)

      };
    }
    console.log(items)
    return items;
  }, [getProposalCounter, getProposal]);

  const submitProposal = useCallback(async (action: any) => {
    const contract = getContract();
    if (!contract || !api || !account) throw new Error('Missing api/account');

    // ADD SIGNER SETUP
    const { web3FromAddress } = await import('@polkadot/extension-dapp');
    const injector = await web3FromAddress(account.address);
    api.setSigner(injector.signer);

    const gasLimit = await estimateGas(
      api,
      contract,
      'submitProposal',
      account,
      [action]
    );
    const tx = contract.tx.submitProposal({
      gasLimit,
      storageDepositLimit: null,
    },
      action
    );
    return tx.signAndSend(account.address as any);
  }, [api, account, getContract]);

  const approveProposal = useCallback(async (id: number) => {
    const contract = getContract();
    if (!contract || !api || !account) throw new Error('Missing api/account');

    // ADD SIGNER SETUP - This is what was missing!
    const { web3FromAddress } = await import('@polkadot/extension-dapp');
    const injector = await web3FromAddress(account.address);
    api.setSigner(injector.signer);

    const gasLimit = await estimateGas(
      api,
      contract,
      'approveProposal',
      account,
      [id]
    );
    const tx = contract.tx.approveProposal({
      gasLimit,
      storageDepositLimit: null,
    }, id);
    return tx.signAndSend(account.address as any);
  }, [api, account, getContract]);

  const executeProposal = useCallback(async (id: number) => {
    const contract = getContract();
    if (!contract || !api || !account) throw new Error('Missing api/account');

    // ADD SIGNER SETUP
    const { web3FromAddress } = await import('@polkadot/extension-dapp');
    const injector = await web3FromAddress(account.address);
    api.setSigner(injector.signer);

    const gasLimit = await estimateGas(
      api,
      contract,
      'executeProposal',
      account,
      [id]
    );
    const tx = contract.tx.executeProposal({
      gasLimit,
      storageDepositLimit: null,
    },
      id
    );
    return tx.signAndSend(account.address as any);
  }, [api, account, getContract]);

  // Convenience helpers for common actions
  const proposePause = useCallback(async () => submitProposal({ PauseContract: null }), [submitProposal]);
  const proposeUnpause = useCallback(async () => submitProposal({ UnpauseContract: null }), [submitProposal]);
  const proposeSetFee = useCallback(async (bps: number) => submitProposal({ SetFee: bps }), [submitProposal]);
  const proposeEmergencyWithdraw = useCallback(async (recipient: string, amount: string | number) => submitProposal({ EmergencyWithdraw: [recipient, amount] }), [submitProposal]);
  const proposeAddSigner = useCallback(async (signer: string) => submitProposal({ AddSigner: signer }), [submitProposal]);
  const proposeRemoveSigner = useCallback(async (signer: string) => submitProposal({ RemoveSigner: signer }), [submitProposal]);
  const proposeSetThreshold = useCallback(async (threshold: number) => submitProposal({ SetThreshold: threshold }), [submitProposal]);

  return {
    // reads
    isAdminSigner,
    getAdminSigners,
    getSignatureThreshold,
    getProposalCounter,
    getProposal,
    listProposals,
    // writes
    submitProposal,
    approveProposal,
    executeProposal,
    proposePause,
    proposeUnpause,
    proposeSetFee,
    proposeEmergencyWithdraw,
    proposeAddSigner,
    proposeRemoveSigner,
    proposeSetThreshold,
  };
};