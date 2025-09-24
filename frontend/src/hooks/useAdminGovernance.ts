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

export const useAdminGovernance = ({ api, account }: UseAdminGovernanceOptions) => {
  const getContract = useCallback(() => {
    if (!api) return null;
    return new ContractPromise(api as any, ESCROW_CONTRACT_ABI as any, ESCROW_CONTRACT_ADDRESS);
  }, [api]);

  const isAdminSigner = useCallback(async (address: string) => {
    const contract = getContract();
    if (!contract || !api) return false;
    const { result, output } = await contract.query.isAdminSigner(
      address,
      { value: 0, gasLimit: -1 },
      address
    );
    if (result.isOk && output) {
      return (output as any).toHuman?.() ?? (output as any).toJSON?.() ?? (output as any);
    }
    return false;
  }, [api, getContract]);

  const getAdminSigners = useCallback(async () => {
    const contract = getContract();
    if (!contract) return [] as string[];
    const { result, output } = await contract.query.getAdminSigners(
      account?.address || ESCROW_CONTRACT_ADDRESS,
      { value: 0, gasLimit: -1 }
    );
    if (result.isOk && output) {
      const data = (output as any).toJSON?.() ?? (output as any);
      return data as string[];
    }
    return [];
  }, [account?.address, getContract]);

  const getSignatureThreshold = useCallback(async () => {
    const contract = getContract();
    if (!contract) return 1;
    const { result, output } = await contract.query.getSignatureThreshold(
      account?.address || ESCROW_CONTRACT_ADDRESS,
      { value: 0, gasLimit: -1 }
    );
    if (result.isOk && output) {
      const data = (output as any).toJSON?.() ?? (output as any);
      return Number(data);
    }
    return 1;
  }, [account?.address, getContract]);

  const getProposalCounter = useCallback(async () => {
    const contract = getContract();
    if (!contract) return 0;
    const { result, output } = await contract.query.getProposalCounter(
      account?.address || ESCROW_CONTRACT_ADDRESS,
      { value: 0, gasLimit: -1 }
    );
    if (result.isOk && output) {
      const data = (output as any).toJSON?.() ?? (output as any);
      return Number(data);
    }
    return 0;
  }, [account?.address, getContract]);

  const getProposal = useCallback(async (id: number): Promise<AdminProposal | null> => {
    const contract = getContract();
    if (!contract) return null;
    const { result, output } = await contract.query.getProposal(
      account?.address || ESCROW_CONTRACT_ADDRESS,
      { value: 0, gasLimit: -1 },
      id
    );
    if (result.isOk && output) {
      const data = (output as any).toJSON?.() ?? (output as any);
      return data as AdminProposal;
    }
    return null;
  }, [account?.address, getContract]);

  const listProposals = useCallback(async () => {
    const total = await getProposalCounter();
    const items: AdminProposal[] = [];
    for (let i = 1; i <= total; i++) {
      const p = await getProposal(i);
      if (p) items.push(p);
    }
    return items;
  }, [getProposalCounter, getProposal]);

  const submitProposal = useCallback(async (action: any) => {
    const contract = getContract();
    if (!contract || !api || !account) throw new Error('Missing api/account');
    const tx = contract.tx.submitProposal({ value: 0, gasLimit: -1 }, action);
    return tx.signAndSend(account.address as any);
  }, [api, account, getContract]);

  const approveProposal = useCallback(async (id: number) => {
    const contract = getContract();
    if (!contract || !api || !account) throw new Error('Missing api/account');
    const tx = contract.tx.approveProposal({ value: 0, gasLimit: -1 }, id);
    return tx.signAndSend(account.address as any);
  }, [api, account, getContract]);

  const executeProposal = useCallback(async (id: number) => {
    const contract = getContract();
    if (!contract || !api || !account) throw new Error('Missing api/account');
    const tx = contract.tx.executeProposal({ value: 0, gasLimit: -1 }, id);
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


