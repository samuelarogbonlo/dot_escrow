// hooks/useUSDTContracts.ts
import { useState, useCallback, useEffect } from 'react';
import { useWallet } from './useWalletContext';
import { BN } from '@polkadot/util';

export interface USDTBalance {
    balance: string;
    formatted: string;
    decimals: number;
}

export interface USDTAllowance {
    allowance: string;
    formatted: string;
    isApproved: boolean;
}

export const useUSDTContract = () => {
    const { api, selectedAccount } = useWallet();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [balance, setBalance] = useState<USDTBalance | null>(null);
    const [allowance, setAllowance] = useState<USDTAllowance | null>(null);

    // USDT Asset ID - try different IDs if 1984 is taken
    const USDT_ASSET_ID = 1984;

    // Your escrow contract address
    const ESCROW_CONTRACT_ADDRESS = "5GvRMZSLS6UzHwExFuw5Fw9Ybic1gRdWH9LFy79ssDbDiWvU";

    // USDT has 6 decimals
    const USDT_DECIMALS = 6;
    const USDT_UNIT = new BN(10).pow(new BN(USDT_DECIMALS));

    // Format USDT amount with proper decimals
    const formatUSDT = useCallback((amount: string | BN): string => {
        const bn = typeof amount === 'string' ? new BN(amount) : amount;
        const formatted = bn.div(USDT_UNIT).toString();
        const remainder = bn.mod(USDT_UNIT).toString().padStart(USDT_DECIMALS, '0');
        return `${formatted}.${remainder.slice(0, 2)}`;
    }, []);

    // Parse USDT amount from user input to asset units
    const parseUSDT = useCallback((amount: string): BN => {
        const [whole, decimal = ''] = amount.split('.');
        const paddedDecimal = decimal.padEnd(USDT_DECIMALS, '0').slice(0, USDT_DECIMALS);
        const totalAmount = whole + paddedDecimal;
        return new BN(totalAmount);
    }, []);

    // Check if assets pallet is available
    const checkAssetsSupport = useCallback((): boolean => {
        if (!api) return false;
        return api.query.assets !== undefined;
    }, [api]);

     // Get USDT balance
    const getBalance = useCallback(async (): Promise<{ success: boolean; balance?: USDTBalance; error?: string }> => {
        if (!api || !selectedAccount) {
            return { success: false, error: 'Wallet not connected' };
        }

        if (!checkAssetsSupport()) {
            return { success: false, error: 'Assets pallet not supported. Make sure you are connected to AssetHub.' };
        }

        setIsLoading(true);
        setError(null);

        try {
            // Check if asset exists
            const assetInfo = await api.query.assets.asset(USDT_ASSET_ID);
            if (!assetInfo.isSome) {
                const errorMsg = 'Asset does not exist. Please create test USDT first.';
                setError(errorMsg);
                return { success: false, error: errorMsg };
            }

            console.log('Asset exists, checking balance...');

            // Query balance
            const balanceQuery = await api.query.assets.account(USDT_ASSET_ID, selectedAccount.address);

            console.log('Balance query result:', balanceQuery.toHuman());

            if (balanceQuery?.isSome) {
                const balanceData = balanceQuery.unwrap();
                const balanceValue = new BN(balanceData.balance.toString());

                const balanceResult: USDTBalance = {
                    balance: balanceValue.toString(),
                    formatted: formatUSDT(balanceValue),
                    decimals: USDT_DECIMALS
                };

                console.log('Balance found:', balanceResult);
                setBalance(balanceResult);
                return { success: true, balance: balanceResult };
            } else {
                const balanceResult: USDTBalance = {
                    balance: '0',
                    formatted: '0.00',
                    decimals: USDT_DECIMALS
                };

                console.log('No balance found, setting to 0');
                setBalance(balanceResult);
                return { success: true, balance: balanceResult };
            }
        } catch (err) {
            console.error('Balance query error:', err);
            const error = `Balance query failed: ${err}`;
            setError(error);
            return { success: false, error };
        } finally {
            setIsLoading(false);
        }
    }, [api, selectedAccount, formatUSDT, checkAssetsSupport]);

    // Get USDT allowance
    const getAllowance = useCallback(async (): Promise<{ success: boolean; allowance?: USDTAllowance; error?: string }> => {
        if (!api || !selectedAccount) {
            return { success: false, error: 'Wallet not connected' };
        }

        if (!checkAssetsSupport()) {
            return { success: false, error: 'Assets pallet not supported' };
        }

        setIsLoading(true);
        setError(null);

        try {
            const approvalQuery = await api.query.assets.approvals(
                USDT_ASSET_ID,
                selectedAccount.address,
                ESCROW_CONTRACT_ADDRESS
            );

            if (approvalQuery.isSome) {
                const approvalData = approvalQuery.unwrap();
                const allowanceValue = new BN(approvalData.amount.toString());

                const allowanceResult: USDTAllowance = {
                    allowance: allowanceValue.toString(),
                    formatted: formatUSDT(allowanceValue),
                    isApproved: allowanceValue.gt(new BN(0))
                };

                setAllowance(allowanceResult);
                return { success: true, allowance: allowanceResult };
            } else {
                const allowanceResult: USDTAllowance = {
                    allowance: '0',
                    formatted: '0.00',
                    isApproved: false
                };

                setAllowance(allowanceResult);
                return { success: true, allowance: allowanceResult };
            }
        } catch (err) {
            const error = `Allowance query failed: ${err}`;
            setError(error);
            return { success: false, error };
        } finally {
            setIsLoading(false);
        }
    }, [api, selectedAccount, formatUSDT, checkAssetsSupport]);

    // Approve USDT spending
    const approveUSDT = useCallback(async (amount: string): Promise<{ success: boolean; error?: string }> => {
        if (!api || !selectedAccount) {
            return { success: false, error: 'Wallet not connected' };
        }

        if (!checkAssetsSupport()) {
            return { success: false, error: 'Assets pallet not supported' };
        }

        setIsLoading(true);
        setError(null);

        try {
            const amountBN = parseUSDT(amount);
            const tx = api.tx.assets.approveTransfer(
                USDT_ASSET_ID,
                ESCROW_CONTRACT_ADDRESS,
                amountBN.toString()
            );

            return new Promise((resolve) => {
                tx.signAndSend(selectedAccount, ({ status, events, dispatchError }: {status: any, events: any, dispatchError: any}) => {
                    if (dispatchError) {
                        console.error('Approval error:', dispatchError.toString());
                        setError(`Approval failed: ${dispatchError.toString()}`);
                        setIsLoading(false);
                        resolve({ success: false, error: dispatchError.toString() });
                        return;
                    }

                    if (status.isFinalized) {
                        const success = !events.some(({ event }: {event: any}) =>
                            event.section === 'system' && event.method === 'ExtrinsicFailed'
                        );

                        if (success) {
                            console.log('USDT approval successful');
                            getAllowance();
                            resolve({ success: true });
                        } else {
                            const error = 'USDT approval failed';
                            setError(error);
                            resolve({ success: false, error });
                        }
                        setIsLoading(false);
                    }
                });
            });
        } catch (err) {
            const error = `Approval failed: ${err}`;
            setError(error);
            setIsLoading(false);
            return { success: false, error };
        }
    }, [api, selectedAccount, parseUSDT, getAllowance, checkAssetsSupport]);

    // Transfer USDT
    const transferUSDT = useCallback(async (
        to: string,
        amount: string
    ): Promise<{ success: boolean; error?: string }> => {
        if (!api || !selectedAccount) {
            return { success: false, error: 'Wallet not connected' };
        }

        if (!checkAssetsSupport()) {
            return { success: false, error: 'Assets pallet not supported' };
        }

        setIsLoading(true);
        setError(null);

        try {
            const amountBN = parseUSDT(amount);
            const tx = api.tx.assets.transfer(USDT_ASSET_ID, to, amountBN.toString());

            return new Promise((resolve) => {
                tx.signAndSend(selectedAccount, ({ status, events, dispatchError }: {status: any, events: any, dispatchError: any}) => {
                    if (dispatchError) {
                        console.error('Transfer error:', dispatchError.toString());
                        setError(`Transfer failed: ${dispatchError.toString()}`);
                        setIsLoading(false);
                        resolve({ success: false, error: dispatchError.toString() });
                        return;
                    }

                    if (status.isFinalized) {
                        const success = !events.some(({ event }: { event: any}) =>
                            event.section === 'system' && event.method === 'ExtrinsicFailed'
                        );

                        if (success) {
                            console.log('USDT transfer successful');
                            getBalance();
                            resolve({ success: true });
                        } else {
                            const error = 'USDT transfer failed';
                            setError(error);
                            resolve({ success: false, error });
                        }
                        setIsLoading(false);
                    }
                });
            });
        } catch (err) {
            const error = `Transfer failed: ${err}`;
            setError(error);
            setIsLoading(false);
            return { success: false, error };
        }
    }, [api, selectedAccount, parseUSDT, getBalance, checkAssetsSupport]);

    // Utility functions
    const checkSufficientBalance = useCallback((requiredAmount: string): boolean => {
        if (!balance) return false;
        const required = parseUSDT(requiredAmount);
        const available = new BN(balance.balance);
        return available.gte(required);
    }, [balance, parseUSDT]);

    const checkSufficientAllowance = useCallback((requiredAmount: string): boolean => {
        if (!allowance) return false;
        const required = parseUSDT(requiredAmount);
        const approved = new BN(allowance.allowance);
        return approved.gte(required);
    }, [allowance, parseUSDT]);

    // Auto-refresh on account change
    useEffect(() => {
        if (selectedAccount && checkAssetsSupport()) {
            getBalance();
            getAllowance();
        }
    }, [selectedAccount, getBalance, getAllowance, checkAssetsSupport]);

    return {
        // State
        balance,
        allowance,
        isLoading,
        error,

        // Methods
        getBalance,
        getAllowance,
        approveUSDT,
        transferUSDT,
        formatUSDT,
        parseUSDT,
        checkSufficientBalance,
        checkSufficientAllowance,
        checkAssetsSupport,

        // Constants
        USDT_DECIMALS,
        USDT_ASSET_ID,
        ESCROW_CONTRACT_ADDRESS
    };
};