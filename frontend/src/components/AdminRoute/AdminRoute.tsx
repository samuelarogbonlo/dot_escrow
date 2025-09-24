
import { useMemo } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useEscrowAdmin } from "@/hooks/useEscrowAdmin";
import { useWallet } from "@/hooks/useWalletContext";

export default function AdminRoute() {
  const { selectedAccount } = useWallet();
  const { ownerAccountId, isLoading } = useEscrowAdmin();

  const isAdmin = useMemo(() => {
    if (!selectedAccount || !ownerAccountId) return false;
    return selectedAccount.address === ownerAccountId;
  }, [selectedAccount, ownerAccountId]);

  if (isLoading) return null;
  return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
}