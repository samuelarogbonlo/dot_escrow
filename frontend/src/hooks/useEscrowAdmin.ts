// src/hooks/useEscrowAdmin.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import { ContractPromise } from "@polkadot/api-contract";

import { useWallet } from "./useWalletContext";
import { ESCROW_CONTRACT_ABI, ESCROW_CONTRACT_ADDRESS } from "../contractABI/EscrowABI";



export const useEscrowAdmin = () => {
  const { api, selectedAccount, getSigner } = useWallet();
  const [ownerAccountId, setOwnerAccountId] = useState<string>();
  const [feeBps, setFeeBps] = useState<number>();
  const [paused, setPaused] = useState<boolean>();
  const [contractBalance, setContractBalance] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);

  const contract = useMemo(() => {
    if (!api) return;
    return new ContractPromise(api, ESCROW_CONTRACT_ABI, ESCROW_CONTRACT_ADDRESS);
  }, [api]);

  const queryOverview = useCallback(async () => {
    if (!contract || !selectedAccount) return;
    setIsLoading(true);
    try {
      const info = await contract.query.getContractInfo(selectedAccount.address, {});
      if (info.result.isOk && info.output) {
        const [owner, feeBpsRaw, pausedRaw] = info.output.toJSON() as [string, number, boolean, string];
        setOwnerAccountId(owner);
        setFeeBps(feeBpsRaw);
        setPaused(pausedRaw);
      }
      const bal = await contract.query.getTokenBalance(selectedAccount.address, {});
      if (bal.result.isOk && bal.output) {
        setContractBalance(bal.output.toString());
      }
    } finally {
      setIsLoading(false);
    }
  }, [contract, selectedAccount]);

  useEffect(() => {
    void queryOverview();
  }, [queryOverview]);

  // Owner-only calls (direct, until multisig is available)
  const pause = useCallback(async () => {
    if (!contract || !selectedAccount || !getSigner) return;
    await contract.tx.pauseContract({ gasLimit: -1 }).signAndSend(selectedAccount.address, { });
    await queryOverview();
  }, [contract, selectedAccount, getSigner, queryOverview]);

  const unpause = useCallback(async () => {
    if (!contract || !selectedAccount || !getSigner) return;
    await contract.tx.unpauseContract({ gasLimit: -1 }).signAndSend(selectedAccount.address, {  });
    await queryOverview();
  }, [contract, selectedAccount, getSigner, queryOverview]);

  const updateFee = useCallback(async (bps: number) => {
    if (!contract || !selectedAccount || !getSigner) return;
    await contract.tx.updateFee({ gasLimit: -1 }, bps).signAndSend(selectedAccount.address, {  });
    await queryOverview();
  }, [contract, selectedAccount, getSigner, queryOverview]);

  // Stubs for future multisig/proposals (replace when contract exposes them)
  const getAdmins = useCallback(async (): Promise<string[]> => {
    return ownerAccountId ? [ownerAccountId] : [];
  }, [ownerAccountId]);

  const getThreshold = useCallback(async (): Promise<number> => 1, []);
  const fetchProposals = useCallback(async () => [], []);
  const submitProposal = useCallback(async (_type: string, _args: any) => {
    // Replace with submit_proposal call once available
  }, []);
  const approveProposal = useCallback(async (_id: string) => {}, []);
  const rejectProposal = useCallback(async (_id: string) => {}, []);

  return {
    isLoading,
    ownerAccountId,
    feeBps,
    paused,
    contractBalance,
    pause,
    unpause,
    updateFee,
    // multisig stubs
    getAdmins,
    getThreshold,
    fetchProposals,
    submitProposal,
    approveProposal,
    rejectProposal,
  };
}