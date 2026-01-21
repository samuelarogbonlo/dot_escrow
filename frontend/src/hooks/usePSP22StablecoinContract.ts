// hooks/usePSP22StablecoinContract.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { useWallet } from './useWalletContext';
import { BN } from '@polkadot/util';
import { ContractPromise } from '@polkadot/api-contract';
import { PSP22_TOKEN_ABI } from '@/contractABI/EscrowABI';
import { ESCROW_CONTRACT_ADDRESS } from '@/contractABI/EscrowABI';
import { substrateToH160 } from '@/utils/substrateToH160';

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

// PSP22 Stablecoins on Pop Network (Paseo Testnet)
export const PASETHUB_NETWORK_STABLECOINS: { [key: string]: StablecoinConfig } = {
    TEST_USDT: {
        name: "Test USDT",
        symbol: "USDT",
        contractAddress: "0x72744B75567f11016F2287f75597a29E14017f83",
        decimals: 10,
        description: "Test USDT on Pop Network (Paseo Testnet)"
    },
};

export const usePSP22StablecoinContract = (
    stablecoinKey: keyof typeof PASETHUB_NETWORK_STABLECOINS = 'TEST_USDT'
) => {

    const stablecoinConfig = PASETHUB_NETWORK_STABLECOINS[stablecoinKey];

    // 2. ADD SAFETY CHECK
    if (!stablecoinConfig) {
        throw new Error(
            `Invalid stablecoin key: "${stablecoinKey}". ` +
            `Available keys: ${Object.keys(PASETHUB_NETWORK_STABLECOINS).join(', ')}`
        );
    }


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
    const [contractExists, setContractExists] = useState<boolean | null>(null);

    const TOKEN_UNIT = useRef(new BN(10).pow(new BN(stablecoinConfig.decimals)));
    const isInitializedRef = useRef(false);


    // Check network connection - MOVED UP
    const checkPaseoNetworkConnection = useCallback((): boolean => {
        if (!api) return false;
        const hasContracts = api.query.contracts !== undefined || api.query.revive !== undefined;
        return hasContracts;
    }, [api]);

    // Verify contract exists on-chain
    const verifyContractExists = useCallback(async (): Promise<boolean> => {
        if (!api) {
            console.log('⏳ API not ready for verification');
            return false;
        }

        console.log("API DATA", api)

        try {
            stablecoinConfig.contractAddress



            // Check Revive pallet
            if (api.query.revive?.accountInfoOf) {
                const contractInfo = await api.query.revive.accountInfoOf(stablecoinConfig.contractAddress);
                console.log(contractInfo)
                const exists = contractInfo.isSome;
                console.log('Contract exists (Revive pallet):', exists);
                if (exists) {
                    console.log('Contract info:', contractInfo.toHuman());
                }
                return exists;
            }

            console.warn('⚠️ No contract pallet found (neither Contracts nor Revive)');
            return false;
        } catch (err) {
            console.error('❌ Contract verification error:', err);
            return false;
        }
    }, [api, stablecoinConfig.contractAddress]);

    // Initialize contract
    useEffect(() => {
        const initContract = async () => {
            if (!api || !stablecoinConfig.contractAddress) {
                console.log('⏳ Waiting for API or contract address...');
                return;
            }

            try {
                console.log('🔄 Initializing contract...');
                console.log('Original H160:', stablecoinConfig.contractAddress);

                // For PolkaVM contracts, use H160 address directly (not padded)
                // The ContractPromise will handle the address format based on the ABI environment
                const contractAddress = stablecoinConfig.contractAddress.startsWith('0x')
                    ? stablecoinConfig.contractAddress
                    : `0x${stablecoinConfig.contractAddress}`;

                console.log('Contract address (H160):', contractAddress);

                // Verify contract exists first (using padded format for on-chain check)
                const exists = await verifyContractExists();
                setContractExists(exists);

                if (!exists) {
                    const errorMsg = `Contract not found at address ${stablecoinConfig.contractAddress}`;
                    console.error('❌', errorMsg);
                    setError(errorMsg);
                    return;
                }

                // Create contract instance with H160 address directly
                // The ABI environment is set to H160 (type 0), so ContractPromise expects H160
                const contractInstance = new ContractPromise(
                    api,
                    PSP22_TOKEN_ABI,
                    contractAddress
                );

                setContract(contractInstance);
                console.log(`✅ Initialized ${stablecoinConfig.name} contract`);
                console.log('Contract address used:', contractInstance.address.toString());
                console.log('Available query methods:', Object.keys(contractInstance.query));
                console.log('Available tx methods:', Object.keys(contractInstance.tx));

            } catch (err: any) {
                console.error(`❌ Failed to initialize ${stablecoinConfig.name} contract`);
                console.error('Error:', err?.message);
                setError(`Failed to initialize contract: ${err?.message || 'Unknown error'}`);
                setContractExists(false);
            }
        };

        initContract();
    }, [api, stablecoinConfig.contractAddress, stablecoinConfig.name, verifyContractExists]);


    // Format token amount
    const formatToken = useCallback((amount: string | BN): string => {
        const bn = typeof amount === 'string' ? new BN(amount) : amount;
        if (bn.isZero()) return '0.00';

        const divisor = TOKEN_UNIT.current;
        const wholePart = bn.div(divisor);
        const remainder = bn.mod(divisor);

        const decimalPlaces = Math.min(stablecoinConfig.decimals, 6);
        const decimalDivisor = new BN(10).pow(new BN(stablecoinConfig.decimals - decimalPlaces));
        const decimalPart = remainder.div(decimalDivisor).toString().padStart(decimalPlaces, '0');

        return `${wholePart.toString()}.${decimalPart}`;
    }, [stablecoinConfig.decimals]);

    // Parse token amount
    const parseToken = useCallback((amount: string): BN => {
        const [whole, decimal = ''] = amount.split('.');
        const paddedDecimal = decimal.padEnd(stablecoinConfig.decimals, '0').slice(0, stablecoinConfig.decimals);
        const totalAmount = whole + paddedDecimal;
        return new BN(totalAmount);
    }, [stablecoinConfig.decimals]);

    // Get contract info
    const getContractInfo = useCallback(async (): Promise<{
        success: boolean;
        info?: any;
        error?: string
    }> => {
        if (!api || !contract) {
            return { success: false, error: 'API or contract not ready' };
        }

        if (contractExists === false) {
            return { success: false, error: 'Contract does not exist' };
        }

        try {
            const gasLimit = api.registry.createType('WeightV2', {
                refTime: new BN('100000000000'),
                proofSize: new BN('262144'),
            });

            

            const queries = await Promise.allSettled([
                contract.query.totalSupply(
                    selectedAccount?.address || '0x0000000000000000000000000000000000000000000000000000000000000000',
                    { gasLimit, storageDepositLimit: null }
                ),
            ]);

            const info = {
                name: stablecoinConfig.name,
                symbol: stablecoinConfig.symbol,
                decimals: stablecoinConfig.decimals,
                totalSupply: '1000000000000000000'
            };

            if (queries[0].status === 'fulfilled' && queries[0].value?.output) {
                const output = queries[0].value.output as any;
                if (output.isOk) {
                    info.totalSupply = output.asOk.toString();
                }
            }

            setContractInfo(info);
            return { success: true, info };
        } catch (err) {
            console.warn('Could not fetch contract info:', err);
            const fallbackInfo = {
                name: stablecoinConfig.name,
                symbol: stablecoinConfig.symbol,
                decimals: stablecoinConfig.decimals,
                totalSupply: '1000000000000000000'
            };
            setContractInfo(fallbackInfo);
            return { success: true, info: fallbackInfo };
        }
    }, [api, contract, selectedAccount?.address, stablecoinConfig, contractExists]);

    // Get balance - TRY DIFFERENT ADDRESS FORMATS
    const getBalance = useCallback(async (): Promise<{
        success: boolean;
        balance?: StablecoinBalance;
        error?: string
    }> => {
        if (!api || !selectedAccount || !contract) {
            return { success: false, error: 'Wallet or contract not ready' };
        }

        if (!checkPaseoNetworkConnection()) {
            return { success: false, error: 'Not connected to Pop Network' };
        }

        if (contractExists === false) {
            return { success: false, error: 'Contract does not exist' };
        }

        setIsLoading(true);
        setError(null);

        try {
            const gasLimit = api.registry.createType('WeightV2', {
                refTime: new BN('100000000000'),
                proofSize: new BN('262144'),
            });


            // Call balanceOf with H160 address
            // The caller (first param) should be SS58 for the API, but the parameter (account to query) should be H160
            const queryResult = await contract.query.balanceOf(
                selectedAccount.address, // Caller (SS58 for API)
                {
                    gasLimit,
                    storageDepositLimit: null,
                },
                substrateToH160(selectedAccount.address) // Parameter - H160 address for the contract
            );


            if (queryResult.result.isErr) {
                const errDetails = queryResult.result.asErr;
                console.error('Balance query error:', errDetails.toHuman());
                const error = `Balance query failed: ${JSON.stringify(errDetails.toHuman())}`;
                setError(error);
                setIsLoading(false);
                return { success: false, error };
            }

            // Process successful result
            if (queryResult.result.isOk && queryResult.output) {
                const outputAny = queryResult.output as any;
                let balanceValue: BN;

                if (outputAny.isOk) {
                    balanceValue = new BN(outputAny.asOk.toString().replace(/,/g, ''));
                } else {
                    balanceValue = new BN(queryResult.output.toString().replace(/,/g, ''));
                }

                const balanceResult: StablecoinBalance = {
                    balance: balanceValue.toString(),
                    formatted: formatToken(balanceValue),
                    decimals: stablecoinConfig.decimals
                };

                console.log(`✅ ${stablecoinConfig.symbol} Balance:`, balanceResult.formatted);
                setBalance(balanceResult);
                setIsLoading(false);
                return { success: true, balance: balanceResult };
            }

            // No output received
            const error = 'Balance query returned no output';
            console.error('❌', error);
            setError(error);
            setIsLoading(false);
            return { success: false, error };

        } catch (err: any) {
            console.error('❌ Balance query exception:', err);
            const error = `Balance query failed: ${err.message || err}`;
            setError(error);
            setIsLoading(false);
            return { success: false, error };
        }
    }, [
        api,
        selectedAccount,
        contract,
        formatToken,
        checkPaseoNetworkConnection,
        stablecoinConfig,
        contractExists
    ]);

    // Get allowance
    const getAllowance = useCallback(async (): Promise<{
        success: boolean;
        allowance?: StablecoinAllowance;
        error?: string
    }> => {
        if (!api || !selectedAccount || !contract) {
            return { success: false, error: 'Wallet or contract not ready' };
        }

        if (!checkPaseoNetworkConnection()) {
            return { success: false, error: 'Not connected to Pop Network' };
        }

        if (contractExists === false) {
            return { success: false, error: 'Contract does not exist' };
        }

        setIsLoading(true);
        setError(null);

        try {
            const gasLimit = api.registry.createType('WeightV2', {
                refTime: new BN('100000000000'),
                proofSize: new BN('262144'),
            });




            const { result, output } = await contract.query.allowance(
                selectedAccount.address, // Caller (SS58 for API)
                {
                    gasLimit,
                    storageDepositLimit: null,
                },
                substrateToH160(selectedAccount.address), // Owner H160
                ESCROW_CONTRACT_ADDRESS // Spender H160
            );

            if (result.isErr) {
                console.error('Allowance query error:', result.asErr.toHuman());
                const allowanceResult: StablecoinAllowance = {
                    allowance: '0',
                    formatted: '0.00',
                    isApproved: false
                };
                setAllowance(allowanceResult);
                setIsLoading(false);
                return { success: true, allowance: allowanceResult };
            }

            if (result.isOk && output) {
                const outputAny = output as any;
                let allowanceValue: BN;

                if (outputAny.isOk) {
                    allowanceValue = new BN(outputAny.asOk.toString().replace(/,/g, ''));
                } else {
                    allowanceValue = new BN(output.toString().replace(/,/g, ''));
                }

                const allowanceResult: StablecoinAllowance = {
                    allowance: allowanceValue.toString(),
                    formatted: formatToken(allowanceValue),
                    isApproved: allowanceValue.gt(new BN(0))
                };

                setAllowance(allowanceResult);
                setIsLoading(false);
                return { success: true, allowance: allowanceResult };
            }

            const allowanceResult: StablecoinAllowance = {
                allowance: '0',
                formatted: '0.00',
                isApproved: false
            };
            setAllowance(allowanceResult);
            setIsLoading(false);
            return { success: true, allowance: allowanceResult };

        } catch (err: any) {
            console.error('Allowance query error:', err);
            const allowanceResult: StablecoinAllowance = {
                allowance: '0',
                formatted: '0.00',
                isApproved: false
            };
            setAllowance(allowanceResult);
            setIsLoading(false);
            return { success: true, allowance: allowanceResult };
        }
    }, [api, selectedAccount, contract, formatToken, checkPaseoNetworkConnection, contractExists]);

    // Approve tokens
    const approveToken = useCallback(async (amount: string): Promise<{
        success: boolean;
        error?: string
    }> => {
        if (!api || !selectedAccount || !contract) {
            return { success: false, error: 'Wallet or contract not ready' };
        }

        if (!checkPaseoNetworkConnection()) {
            return { success: false, error: 'Not connected to Pop Network' };
        }

        if (contractExists === false) {
            return { success: false, error: 'Contract does not exist' };
        }

        setIsLoading(true);
        setError(null);

        try {
            const amountBN = parseToken(amount);

            // Use increase_allowance instead of approve - more reliable, no race condition issues
            // Calculate how much more allowance we need
            const currentAllowanceResult = await getAllowance();
            const existingAllowanceBN = new BN(currentAllowanceResult.allowance?.allowance || '0');

            let deltaAmount = amountBN;
            if (existingAllowanceBN.gte(amountBN)) {
                // Already have enough allowance
                console.log('[Approval] Already have sufficient allowance:', existingAllowanceBN.toString());
                setIsLoading(false);
                return { success: true };
            } else {
                // Calculate how much more we need
                deltaAmount = amountBN.sub(existingAllowanceBN);
            }

            console.log('[Approval] Using increase_allowance with params:', {
                caller: selectedAccount.address,
                spender: ESCROW_CONTRACT_ADDRESS,
                deltaAmount: deltaAmount.toString(),
                existingAllowance: existingAllowanceBN.toString(),
                targetAmount: amountBN.toString()
            });

            const query = await contract.query.increaseAllowance(
                selectedAccount.address, // Caller (SS58 for API)
                {
                    gasLimit: api.registry.createType('WeightV2', {
                        refTime: new BN('100000000000'),
                        proofSize: new BN('262144'),
                    }),
                    storageDepositLimit: null,
                },
                ESCROW_CONTRACT_ADDRESS, // Spender H160
                deltaAmount.toString()
            );

            console.log('[Approval] Dry-run result:', {
                isOk: query.result.isOk,
                isErr: query.result.isErr,
                output: query.output?.toHuman?.(),
                gasRequired: query.gasRequired?.toHuman?.()
            });

            if (query.result.isErr) {
                const error = `Approval dry run failed: ${query.result.asErr.toHuman()}`;
                console.error('[Approval] Dry-run error:', query.result.asErr.toHuman());
                setError(error);
                setIsLoading(false);
                return { success: false, error };
            }

            const { gasRequired, storageDeposit } = query;
            const signerResult = await getSigner(selectedAccount.address);
            if (!signerResult.success) {
                setIsLoading(false);
                return { success: false, error: signerResult.error || 'Failed to get signer' };
            }

            return new Promise((resolve) => {
                contract.tx.increaseAllowance(
                    {
                        gasLimit: gasRequired,
                        storageDepositLimit: storageDeposit.isCharge ? storageDeposit.asCharge : null,
                    },
                    ESCROW_CONTRACT_ADDRESS, // Spender H160
                    deltaAmount.toString()
                ).signAndSend(selectedAccount.address, { signer: signerResult.signer }, (result: any) => {
                    const { status, events, dispatchError } = result;

                    console.log(`[Approval] Transaction status:`, status.type);

                    if (dispatchError) {
                        console.error(`[Approval] Dispatch error:`, dispatchError.toString());
                        setError(`Approval failed: ${dispatchError.toString()}`);
                        setIsLoading(false);
                        resolve({ success: false, error: dispatchError.toString() });
                        return;
                    }

                    // Resolve on isInBlock for faster UX (don't wait for finalization)
                    if (status.isInBlock) {
                        console.log(`[Approval] Transaction included in block:`, status.asInBlock.toString());

                        const success = !events?.some(({ event }: { event: any }) =>
                            event.section === 'system' && event.method === 'ExtrinsicFailed'
                        );

                        if (success) {
                            console.log(`✅ ${stablecoinConfig.symbol} approval successful`);
                            getAllowance();
                            setIsLoading(false);
                            resolve({ success: true });
                        } else {
                            const error = `${stablecoinConfig.symbol} approval failed`;
                            console.error(`[Approval] Transaction failed:`, error);
                            setError(error);
                            setIsLoading(false);
                            resolve({ success: false, error });
                        }
                    } else if (status.isDropped || status.isInvalid) {
                        const error = 'Transaction was dropped or invalid';
                        console.error(`[Approval] ${error}`);
                        setError(error);
                        setIsLoading(false);
                        resolve({ success: false, error });
                    }
                }).catch((err: any) => {
                    console.error(`[Approval] SignAndSend error:`, err);
                    setError(`Approval failed: ${err.message || err}`);
                    setIsLoading(false);
                    resolve({ success: false, error: err.message || 'Transaction failed' });
                });
            });
        } catch (err: any) {
            const error = `Approval failed: ${err.message || err}`;
            setError(error);
            setIsLoading(false);
            return { success: false, error };
        }
    }, [api, selectedAccount, contract, parseToken, getAllowance, checkPaseoNetworkConnection, stablecoinConfig.symbol, getSigner, contractExists]);

    // Transfer tokens
    const transferToken = useCallback(async (
        to: string,
        amount: string
    ): Promise<{ success: boolean; error?: string; txHash?: string }> => {
        if (!api || !selectedAccount || !contract) {
            return { success: false, error: 'Wallet or contract not ready' };
        }

        if (!checkPaseoNetworkConnection()) {
            return { success: false, error: 'Not connected to Pop Network' };
        }

        if (contractExists === false) {
            return { success: false, error: 'Contract does not exist' };
        }

        setIsLoading(true);
        setError(null);

        try {
            const amountBN = parseToken(amount);

            // Convert 'to' address to H160 if it's SS58, otherwise use as-is
           

            const { gasRequired, storageDeposit } = await contract.query.transfer(
                selectedAccount.address, // Caller (SS58 for API)
                {
                    gasLimit: api.registry.createType('WeightV2', {
                        refTime: new BN('100000000000'),
                        proofSize: new BN('262144'),
                    }),
                    storageDepositLimit: null,
                },
                to, // To address in H160 format
                amountBN.toString(),
                []
            );

            const signerResult = await getSigner(selectedAccount.address);
            if (!signerResult.success) {
                setIsLoading(false);
                return { success: false, error: signerResult.error || 'Failed to get signer' };
            }

            return new Promise((resolve) => {
                contract.tx.transfer(
                    {
                        gasLimit: gasRequired,
                        storageDepositLimit: storageDeposit.isCharge ? storageDeposit.asCharge : null,
                    },
                    to, // To address in H160 format
                    amountBN.toString(),
                    []
                ).signAndSend(selectedAccount.address, { signer: signerResult.signer }, (result: any) => {
                    const { status, events, dispatchError, txHash } = result;

                    console.log(`[Transfer] Transaction status:`, status.type);

                    if (dispatchError) {
                        console.error(`[Transfer] Dispatch error:`, dispatchError.toString());
                        setError(`Transfer failed: ${dispatchError.toString()}`);
                        setIsLoading(false);
                        resolve({
                            success: false,
                            error: dispatchError.toString(),
                            txHash: txHash?.toString()
                        });
                        return;
                    }

                    // Resolve on isInBlock for faster UX (don't wait for finalization)
                    if (status.isInBlock) {
                        console.log(`[Transfer] Transaction included in block:`, status.asInBlock.toString());

                        const success = !events?.some(({ event }: { event: any }) =>
                            event.section === 'system' && event.method === 'ExtrinsicFailed'
                        );

                        if (success) {
                            console.log(`✅ Transfer successful`);
                            getBalance();
                            setIsLoading(false);
                            resolve({ success: true, txHash: txHash?.toString() });
                        } else {
                            const error = `Transfer failed`;
                            console.error(`[Transfer] Transaction failed:`, error);
                            setError(error);
                            setIsLoading(false);
                            resolve({ success: false, error, txHash: txHash?.toString() });
                        }
                    } else if (status.isDropped || status.isInvalid) {
                        const error = 'Transaction was dropped or invalid';
                        console.error(`[Transfer] ${error}`);
                        setError(error);
                        setIsLoading(false);
                        resolve({ success: false, error, txHash: txHash?.toString() });
                    }
                }).catch((err: any) => {
                    console.error(`[Transfer] SignAndSend error:`, err);
                    setError(`Transfer failed: ${err.message || err}`);
                    setIsLoading(false);
                    resolve({ success: false, error: err.message || 'Transaction failed' });
                });
            });
        } catch (err: any) {
            const error = `Transfer failed: ${err.message || err}`;
            setError(error);
            setIsLoading(false);
            return { success: false, error };
        }
    }, [api, selectedAccount, contract, parseToken, getBalance, checkPaseoNetworkConnection, getSigner, contractExists]);

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


    // Auto-refresh on mount
    useEffect(() => {
        // Only run if all conditions are met
        const shouldRefresh = selectedAccount &&
            contract &&
            checkPaseoNetworkConnection() &&
            contractExists === true &&
            !isInitializedRef.current;

        if (shouldRefresh) {
            isInitializedRef.current = true;

            console.log('🔄 Auto-refreshing contract data...');
            getContractInfo();
            getBalance();
            getAllowance();
        }

        return () => {
            if (!selectedAccount) {
                isInitializedRef.current = false;
            }
        };
    }, [selectedAccount, contract, contractExists, checkPaseoNetworkConnection, getContractInfo, getBalance, getAllowance]);

    return {
        stablecoinConfig,
        balance,
        allowance,
        contractInfo,
        isLoading,
        error,
        contract,
        contractExists,

        getBalance,
        getAllowance,
        approveToken,
        transferToken,
        formatToken,
        checkSufficientBalance,
        checkSufficientAllowance,

        TOKEN_DECIMALS: stablecoinConfig.decimals,
        TOKEN_CONTRACT_ADDRESS: stablecoinConfig.contractAddress,
        ESCROW_CONTRACT_ADDRESS,

        availableStablecoins: PASETHUB_NETWORK_STABLECOINS
    };
};