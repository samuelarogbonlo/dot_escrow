// hooks/usePSP22StablecoinContract.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { useWallet } from './useWalletContext';
import { BN } from '@polkadot/util';
import { ContractPromise } from '@polkadot/api-contract';
import { PSP22_ABI } from '@/contractABI/PSP22ABI';


export interface StablecoinBalance {
    balance: string;
    formatted: string;
    decimals: number;
}

export interface StablecoinAllowance {
    allowance: string;
    formatted: string;
    isApproved: boolean;
}

export interface StablecoinConfig {
    name: string;
    symbol: string;
    contractAddress: string;
    decimals: number;
    description?: string;
}

// Available PSP22 Stablecoins on Aleph Zero
export const ALEPH_ZERO_STABLECOINS: { [key: string]: StablecoinConfig } = {
    MOST_USDC: {
        name: "USDC",
        symbol: "USDC",
        contractAddress: "5EFDb7mKbougLtr5dnwd5KDfZ3wK55JPGPLiryKq4uRMPR46",
        decimals: 6,
        description: "USDC bridged via MOST Bridge"
    },
};

export const usePSP22StablecoinContract = (stablecoinKey: keyof typeof ALEPH_ZERO_STABLECOINS = 'MOST_USDC') => {
    const { api, selectedAccount, getSigner } = useWallet();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [balance, setBalance] = useState<StablecoinBalance | null>(null);
    const [allowance, setAllowance] = useState<StablecoinAllowance | null>(null);
    const [contract, setContract] = useState<ContractPromise | null>(null);
    const [contractInfo, setContractInfo] = useState<{
        name: string;
        symbol: string;
        decimals: number;
        totalSupply: string;
    } | null>(null);

    // Get current stablecoin config
    const stablecoinConfig = ALEPH_ZERO_STABLECOINS[stablecoinKey];

    // Your escrow contract address - update this with your actual contract
    const ESCROW_CONTRACT_ADDRESS = "5GvRMZSLS6UzHwExFuw5Fw9Ybic1gRdWH9LFy79ssDbDiWvU";

    // Use useRef to store stable references
    const TOKEN_UNIT = useRef(new BN(10).pow(new BN(stablecoinConfig.decimals)));
    const isInitializedRef = useRef(false);



    // Initialize contract
    useEffect(() => {
        if (api && stablecoinConfig.contractAddress) {
            try {
                const contractInstance = new ContractPromise(api, PSP22_ABI, stablecoinConfig.contractAddress);
                setContract(contractInstance);
                console.log(`Initialized ${stablecoinConfig.name} contract:`, stablecoinConfig.contractAddress);
            } catch (err) {
                console.error(`Failed to initialize ${stablecoinConfig.name} contract:`, err);
                setError(`Failed to initialize ${stablecoinConfig.name} contract`);
            }
        }
    }, [api, stablecoinConfig.contractAddress, stablecoinConfig.name]);

    // Format token amount with proper decimals
    const formatToken = useCallback((amount: string | BN): string => {
        const bn = typeof amount === 'string' ? new BN(amount) : amount;

        if (bn.isZero()) return '0.00';

        // Handle different decimal places properly
        const divisor = TOKEN_UNIT.current;
        const wholePart = bn.div(divisor);
        const remainder = bn.mod(divisor);

        // Format decimal part based on token decimals
        const decimalPlaces = Math.min(stablecoinConfig.decimals, 6); // Show max 6 decimal places
        const decimalDivisor = new BN(10).pow(new BN(stablecoinConfig.decimals - decimalPlaces));
        const decimalPart = remainder.div(decimalDivisor).toString().padStart(decimalPlaces, '0');

        return `${wholePart.toString()}.${decimalPart}`;
    }, [stablecoinConfig.decimals]);

    // Parse token amount from user input to contract units
    const parseToken = useCallback((amount: string): BN => {
        const [whole, decimal = ''] = amount.split('.');
        const paddedDecimal = decimal.padEnd(stablecoinConfig.decimals, '0').slice(0, stablecoinConfig.decimals);
        const totalAmount = whole + paddedDecimal;
        return new BN(totalAmount);
    }, [stablecoinConfig.decimals]);

    // Check if we're connected to Aleph Zero 
    const checkAlephZeroConnection = useCallback((): boolean => {
        if (!api) return false;
        const hasContracts = api.query.contracts !== undefined;
        return hasContracts;
    }, [api]);

    // Get contract information (name, symbol, decimals, total supply)
    const getContractInfo = useCallback(async (): Promise<{ success: boolean; info?: any; error?: string }> => {
        if (!api || !contract) {
            return { success: false, error: 'API or contract not ready' };
        }

        try {
            const gasLimit = api.registry.createType('WeightV2', {
                refTime: new BN('10000000000'),
                proofSize: new BN('131072'),
            });

            // Try to get token info (some contracts might not have all these methods)
            const queries = await Promise.allSettled([
                contract.query.tokenName?.(selectedAccount?.address || '0x00', { gasLimit, storageDepositLimit: null }),
                contract.query.tokenSymbol?.(selectedAccount?.address || '0x00', { gasLimit, storageDepositLimit: null }),
                contract.query.tokenDecimals?.(selectedAccount?.address || '0x00', { gasLimit, storageDepositLimit: null }),
                contract.query.totalSupply?.(selectedAccount?.address || '0x00', { gasLimit, storageDepositLimit: null })
            ]);

            const info = {
                name: stablecoinConfig.name,
                symbol: stablecoinConfig.symbol,
                decimals: stablecoinConfig.decimals,
                totalSupply: '0'
            };

            // Parse results if available
            if (queries[0].status === 'fulfilled' && queries[0].value?.output) {
                info.name = queries[0].value.output.toString();
            }
            if (queries[1].status === 'fulfilled' && queries[1].value?.output) {
                info.symbol = queries[1].value.output.toString();
            }
            if (queries[2].status === 'fulfilled' && queries[2].value?.output) {
                info.decimals = parseInt(queries[2].value.output.toString());
            }
            if (queries[3].status === 'fulfilled' && queries[3].value?.output) {
                info.totalSupply = queries[3].value.output.toString();
            }

            setContractInfo(info);
            return { success: true, info };
        } catch (err) {
            console.warn('Could not fetch contract info:', err);
            // Set fallback info
            const fallbackInfo = {
                name: stablecoinConfig.name,
                symbol: stablecoinConfig.symbol,
                decimals: stablecoinConfig.decimals,
                totalSupply: '0'
            };
            setContractInfo(fallbackInfo);
            return { success: true, info: fallbackInfo };
        }
    }, [api, contract, selectedAccount?.address, stablecoinConfig]);

    // Get token balance
    const getBalance = useCallback(async (): Promise<{ success: boolean; balance?: StablecoinBalance; error?: string }> => {
        if (!api || !selectedAccount || !contract) {
            return { success: false, error: 'Wallet or contract not ready' };
        }

        if (!checkAlephZeroConnection()) {
            return { success: false, error: 'Not connected to Aleph Zero network' };
        }

        setIsLoading(true);
        setError(null);

        try {

            const gasLimit = api.registry.createType('WeightV2', {
                refTime: new BN('10000000000'),
                proofSize: new BN('131072'),
            });

            console.log('Calling balanceOf with address:', selectedAccount.address);

            const queryResult = await contract.query["psp22::balanceOf"](
                selectedAccount.address,
                {
                    gasLimit,
                    storageDepositLimit: null,
                },
                selectedAccount.address
            );

            console.log('Query result:', queryResult);

            const { result, output } = queryResult;

            if (result.isOk && output) {
                // Cast output to any to avoid TypeScript errors
                const outputAny = output as any

                // The key fix: properly extract the balance value
                let balanceValue: BN;

                if (outputAny.isOk) {
                    // If output is a Result type, get the Ok value
                    const okValue = outputAny.asOk;
                    balanceValue = new BN(okValue.toString());
                    console.log('Extracted from output.asOk:', okValue.toString());
                } else {
                    // Fallback: convert output directly
                    balanceValue = new BN(output.toString());
                    console.log('Extracted from output.toString():', output.toString());
                }

                console.log("Final balance value:", balanceValue.toString());

                const balanceResult: StablecoinBalance = {
                    balance: balanceValue.toString(),
                    formatted: formatToken(balanceValue),
                    decimals: stablecoinConfig.decimals
                };

                console.log(`${stablecoinConfig.symbol} Balance found:`, balanceResult);
                setBalance(balanceResult);
                return { success: true, balance: balanceResult };
            } else {
                const error = result.isErr ? result.asErr.toString() : 'Balance query failed';
                console.log('Query failed:', error);
                setError(error);
                return { success: false, error };
            }
        } catch (err: any) {
            console.error('Balance query error:', err);
            console.error('Error stack:', err.stack);
            const error = `Balance query failed: ${err}`;
            setError(error);
            return { success: false, error };
        } finally {
            setIsLoading(false);
        }
    }, [api, selectedAccount, contract, formatToken, checkAlephZeroConnection, stablecoinConfig.decimals, stablecoinConfig.symbol]);

    // Get token allowance
    const getAllowance = useCallback(async (): Promise<{ success: boolean; allowance?: StablecoinAllowance; error?: string }> => {
        if (!api || !selectedAccount || !contract) {
            return { success: false, error: 'Wallet or contract not ready' };
        }

        if (!checkAlephZeroConnection()) {
            return { success: false, error: 'Not connected to Aleph Zero network' };
        }

        setIsLoading(true);
        setError(null);

        try {
            const { result, output } = await contract.query["psp22::allowance"](
                selectedAccount.address,
                {
                    gasLimit: api.registry.createType('WeightV2', {
                        refTime: new BN('10000000000'),
                        proofSize: new BN('131072'),
                    }),
                    storageDepositLimit: null,
                },
                selectedAccount.address,
                ESCROW_CONTRACT_ADDRESS
            );

            if (result.isOk && output) {
                const outputAny = output as any

                let allowanceValue;

                if (outputAny.isOk) {
                    // If output is a Result type, get the Ok value
                    const okValue = outputAny.asOk;
                    allowanceValue = new BN(okValue.toString());
                    console.log('Extracted from output.asOk:', okValue.toString());
                } else {
                    // Fallback: convert output directly
                    allowanceValue = new BN(output.toString());
                    console.log('Extracted from output.toString():', output.toString());
                }

                console.log("Final allowance value:", allowanceValue.toString());


                const allowanceResult: StablecoinAllowance = {
                    allowance: allowanceValue.toString(),
                    formatted: formatToken(allowanceValue),
                    isApproved: allowanceValue.gt(new BN(0))
                };

                setAllowance(allowanceResult);
                return { success: true, allowance: allowanceResult };
            } else {
                const allowanceResult: StablecoinAllowance = {
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
    }, [api, selectedAccount, contract, formatToken, checkAlephZeroConnection]);

    // Approve token spending
    const approveToken = useCallback(async (amount: string): Promise<{ success: boolean; error?: string }> => {
        if (!api || !selectedAccount || !contract) {
            return { success: false, error: 'Wallet or contract not ready' };
        }

        if (!checkAlephZeroConnection()) {
            return { success: false, error: 'Not connected to Aleph Zero network' };
        }

        setIsLoading(true);
        setError(null);

        console.log("approve has reached this stage");

        try {
            const amountBN = parseToken(amount);

            const query = await contract.query["psp22::approve"](
                selectedAccount.address,
                {
                    gasLimit: api.registry.createType('WeightV2', {
                        refTime: new BN('10000000000'),
                        proofSize: new BN('131072'),
                    }),
                    storageDepositLimit: null,
                },
                ESCROW_CONTRACT_ADDRESS,
                amountBN.toString()
            );

            console.log('query result: ', query);

            const { gasRequired, storageDeposit } = query;

            // Get the signer using your getSigner function
            const signerResult = await getSigner(selectedAccount.address);
            if (!signerResult.success) {
                setIsLoading(false);
                return { success: false, error: signerResult.error || 'Failed to get signer' };
            }

            return new Promise((resolve) => {
                contract.tx["psp22::approve"](
                    {
                        gasLimit: gasRequired,
                        storageDepositLimit: storageDeposit.isCharge ? storageDeposit.asCharge : null,
                    },
                    ESCROW_CONTRACT_ADDRESS,
                    amountBN.toString()
                ).signAndSend(selectedAccount.address, { signer: signerResult.signer }, (result: any) => {
                    const { status, events, dispatchError } = result;
                    console.log('Transaction status:', status.type);

                    if (dispatchError) {
                        console.error('Approval error:', dispatchError.toString());
                        setError(`Approval failed: ${dispatchError.toString()}`);
                        setIsLoading(false);
                        resolve({ success: false, error: dispatchError.toString() });
                        return;
                    }

                    if (status.isFinalized) {
                        const success = !events.some(({ event }: { event: any }) =>
                            event.section === 'system' && event.method === 'ExtrinsicFailed'
                        );

                        if (success) {
                            console.log(`${stablecoinConfig.symbol} approval successful`);
                            getAllowance();
                            resolve({ success: true });
                        } else {
                            const error = `${stablecoinConfig.symbol} approval failed`;
                            setError(error);
                            resolve({ success: false, error });
                        }
                        setIsLoading(false);
                    }
                });
            });
        } catch (err) {
            const error = `Approval failed: ${err}`;
            console.log('approve gone wrong');
            setError(error);
            setIsLoading(false);
            return { success: false, error };
        }
    }, [api, selectedAccount, contract, parseToken, getAllowance, checkAlephZeroConnection, stablecoinConfig.symbol, getSigner]);
    // Transfer tokens
   const transferToken = useCallback(async (
    to: string,
    amount: string
): Promise<{ success: boolean; error?: string; txHash?: string }> => {
    if (!api || !selectedAccount || !contract) {
        return { success: false, error: 'Wallet or contract not ready' };
    }

    if (!checkAlephZeroConnection()) {
        return { success: false, error: 'Not connected to Aleph Zero network' };
    }

    setIsLoading(true);
    setError(null);

    try {
        const amountBN = parseToken(amount);

        const { gasRequired, storageDeposit } = await contract.query["psp22::transfer"](
            selectedAccount.address,
            {
                gasLimit: api.registry.createType('WeightV2', {
                    refTime: new BN('10000000000'),
                    proofSize: new BN('131072'),
                }),
                storageDepositLimit: null,
            },
            to,
            amountBN.toString(),
            []
        );

        // Get the signer using your getSigner function
        const signerResult = await getSigner(selectedAccount.address);
        if (!signerResult.success) {
            setIsLoading(false);
            return { success: false, error: signerResult.error || 'Failed to get signer' };
        }

        return new Promise((resolve) => {
            contract.tx["psp22::transfer"](
                {
                    gasLimit: gasRequired,
                    storageDepositLimit: storageDeposit.isCharge ? storageDeposit.asCharge : null,
                },
                to,
                amountBN.toString(),
                []
            ).signAndSend(selectedAccount.address, { signer: signerResult.signer }, (result: any) => {
                const { status, events, dispatchError, txHash } = result;

                if (dispatchError) {
                    console.error('Transfer error:', dispatchError.toString());
                    setError(`Transfer failed: ${dispatchError.toString()}`);
                    setIsLoading(false);
                    resolve({ 
                        success: false, 
                        error: dispatchError.toString(),
                        txHash: txHash?.toString() // Include txHash even on error for debugging
                    });
                    return;
                }

                if (status.isFinalized) {
                    const success = !events.some(({ event }: { event: any }) =>
                        event.section === 'system' && event.method === 'ExtrinsicFailed'
                    );

                    if (success) {
                        console.log(`${stablecoinConfig.symbol} transfer successful, txHash: ${txHash?.toString()}`);
                        getBalance();
                        resolve({ 
                            success: true, 
                            txHash: txHash?.toString() 
                        });
                    } else {
                        const error = `${stablecoinConfig.symbol} transfer failed`;
                        setError(error);
                        resolve({ 
                            success: false, 
                            error,
                            txHash: txHash?.toString() 
                        });
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
}, [api, selectedAccount, contract, parseToken, getBalance, checkAlephZeroConnection, stablecoinConfig.symbol]);
    // Utility functions
    const checkSufficientBalance = useCallback((requiredAmount: string): boolean => {
        if (!balance) return false;
        const required = parseToken(requiredAmount);
        const available = new BN(balance.balance);
        return available.gte(required);
    }, [balance, parseToken]);

    const checkSufficientAllowance = useCallback((requiredAmount: string): boolean => {
        if (!allowance) return false;
        const required = parseToken(requiredAmount);
        const approved = new BN(allowance.allowance);
        return approved.gte(required);
    }, [allowance, parseToken]);

    // FIXED: Auto-refresh on account change - remove functions from dependency array
    useEffect(() => {
        if (selectedAccount && contract && checkAlephZeroConnection() && !isInitializedRef.current) {
            isInitializedRef.current = true;
            getContractInfo();
            getBalance();
            getAllowance();
        }

        // Reset initialization flag when account changes
        return () => {
            if (selectedAccount) {
                isInitializedRef.current = false;
            }
        };
    }, [selectedAccount?.address, contract, api]); // Only depend on primitive values

    // Provide a manual refresh function
    const refreshData = useCallback(async () => {
        if (selectedAccount && contract && checkAlephZeroConnection()) {
            await Promise.all([
                getContractInfo(),
                getBalance(),
                getAllowance()
            ]);
        }
    }, [selectedAccount, contract, getContractInfo, getBalance, getAllowance, checkAlephZeroConnection]);

    return {
        // Current stablecoin configuration
        stablecoinConfig,

        // State
        balance,
        allowance,
        contractInfo,
        isLoading,
        error,
        contract,

        // Methods
        getBalance,
        getAllowance,
        getContractInfo,
        approveToken,
        transferToken,
        formatToken,
        parseToken,
        checkSufficientBalance,
        checkSufficientAllowance,
        checkAlephZeroConnection,
        refreshData, // New manual refresh function

        // Constants
        TOKEN_DECIMALS: stablecoinConfig.decimals,
        TOKEN_CONTRACT_ADDRESS: stablecoinConfig.contractAddress,
        ESCROW_CONTRACT_ADDRESS,

        // Available stablecoins
        availableStablecoins: ALEPH_ZERO_STABLECOINS
    };
};