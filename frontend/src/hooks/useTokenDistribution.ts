import { useState, useCallback, useEffect, useRef } from 'react';
import { ApiPromise } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { TOKEN_CONTRACT_ABI, TOKEN_CONTRACT_ADDRESS } from '@/contractABI/EscrowABI';

// Codec safety utilities
const isResultOk = (result: any): boolean => {
    if (!result || !result.result) return false;

    if (typeof result.result.isOk === 'boolean') {
        return result.result.isOk;
    }

    if (typeof result.result.isOk === 'function') {
        return result.result.isOk();
    }

    if (result.result.isOk?.valueOf) {
        return result.result.isOk.valueOf() === true;
    }

    return false;
};

const safeExtractOutput = (output: any): any => {
    if (!output) return null;

    if (typeof output.toHuman === 'function') {
        return output.toHuman();
    }

    if (typeof output.toString === 'function') {
        return output.toString();
    }

    return output;
};

const safeToString = (value: any): string => {
    if (value === null || value === undefined) return '0';

    let str = '';
    if (typeof value.toString === 'function') {
        str = value.toString();
    } else {
        str = String(value);
    }

    return str.replace(/,/g, '');
};

const safeExtractNestedResult = (result: any): any => {
    if (!isResultOk(result)) return null;

    const output = result.output;
    if (!output) return null;

    // Check if it's a nested Result
    if (output.isOk || (typeof output.isOk === 'function' && output.isOk())) {
        if (typeof output.asOk === 'function') {
            return output.asOk();
        }
        if (typeof output.unwrap === 'function') {
            return output.unwrap();
        }
    }

    return output;
};

// Types based on your smart contract
export interface FaucetConfig {
    tokenContract: string | null;
    distributionAmount: string;
    cooldownPeriod: string;
    totalDistributed: string;
    paused: boolean;
}

export interface ClaimStatus {
    canClaim: boolean;
    timeUntilNextClaim: number;
    lastClaimTime: number | null;
}

export interface RateLimits {
    maxDaily: string;
    maxHourly: string;
    dailyDistributed: string;
    hourlyDistributed: string;
}

export interface TokenDistributionError {
    code:
    | 'AlreadyClaimed'
    | 'InsufficientTokenBalance'
    | 'Unauthorized'
    | 'ContractPaused'
    | 'InvalidAmount'
    | 'TokenTransferFailed'
    | 'TokenNotConfigured'
    | 'DailyLimitExceeded'
    | 'HourlyLimitExceeded'
    | 'NetworkError'
    | 'UnknownError';
    message: string;
}

export interface UseTokenDistributionProps {
    api: ApiPromise | null;
    selectedAccount?: InjectedAccountWithMeta;
}

export interface UseTokenDistributionReturn {
    // State
    isLoading: boolean;
    error: TokenDistributionError | null;
    config: FaucetConfig | null;

    // Actions
    claimTokens: (recipientAddress?: string) => Promise<boolean>;
    checkClaimStatus: (address: string) => Promise<ClaimStatus | null>;
    getFaucetConfig: () => Promise<FaucetConfig | null>;
    getRateLimits: () => Promise<RateLimits | null>;
    getTokenBalance: () => Promise<string | null>;

    // Utils
    clearError: () => void;
    formatTimeRemaining: (seconds: number) => string;
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

const useTokenDistribution = ({
    api,
    selectedAccount
}: UseTokenDistributionProps): UseTokenDistributionReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<TokenDistributionError | null>(null);
    const [config, setConfig] = useState<FaucetConfig | null>(null);

    // Use ref to track if config has been loaded to prevent unnecessary re-fetches
    const configLoadedRef = useRef(false);

    // Initialize contract instance
    const getContract = useCallback(() => {
        if (!api) return null;
        return new ContractPromise(api as any, TOKEN_CONTRACT_ABI as any, TOKEN_CONTRACT_ADDRESS);
    }, [api]);

    const contract = getContract();

    // Error handling helper
    const handleError = useCallback((error: any, defaultMessage: string = 'An unknown error occurred'): TokenDistributionError => {
        console.error('Contract interaction error:', error);

        if (error?.registry?.findMetaError) {
            const metaError = error.registry.findMetaError(error.asModule);
            if (metaError?.name) {
                return {
                    code: metaError.name as any,
                    message: metaError.docs?.join(' ') || metaError.name
                };
            }
        }

        if (error?.message?.includes('AlreadyClaimed')) {
            return { code: 'AlreadyClaimed', message: 'You have already claimed tokens recently. Please wait for the cooldown period.' };
        }
        if (error?.message?.includes('InsufficientTokenBalance')) {
            return { code: 'InsufficientTokenBalance', message: 'The faucet has insufficient token balance.' };
        }
        if (error?.message?.includes('ContractPaused')) {
            return { code: 'ContractPaused', message: 'The faucet is currently paused.' };
        }
        if (error?.message?.includes('TokenNotConfigured')) {
            return { code: 'TokenNotConfigured', message: 'Token contract is not configured.' };
        }
        if (error?.message?.includes('DailyLimitExceeded')) {
            return { code: 'DailyLimitExceeded', message: 'Daily distribution limit has been exceeded.' };
        }
        if (error?.message?.includes('HourlyLimitExceeded')) {
            return { code: 'HourlyLimitExceeded', message: 'Hourly distribution limit has been exceeded.' };
        }

        return {
            code: 'UnknownError',
            message: error?.message || defaultMessage
        };
    }, []);

    // Claim tokens function
    const claimTokens = useCallback(async (recipientAddress?: string): Promise<boolean> => {
        if (!api || !contract || !selectedAccount) {
            setError({ code: 'NetworkError', message: 'API, contract, or account not available' });
            return false;
        }

        setIsLoading(true);
        setError(null);

        console.log("trying to claim token")

        try {
            const { web3FromSource } = await import('@polkadot/extension-dapp');
            const injector = await web3FromSource(selectedAccount.meta.source);

            // Choose the appropriate method
            const method = recipientAddress ? 'claimTokensFor' : 'claimTokens';
            const args = recipientAddress ? [recipientAddress] : [];
            api.setSigner(injector.signer);

            // Get gas estimation
            const gasLimit = await estimateGas(
                api,
                contract,
                method,
                selectedAccount,
                args
            );

            // Execute the transaction
            const tx = contract.tx[method](
                { gasLimit },
                ...args
            );

            await new Promise<void>((resolve, reject) => {
                tx.signAndSend(
                    selectedAccount.address,
                    ({ status, dispatchError }) => {
                        if (status.isInBlock) {
                            console.log('Transaction included in block:', status.asInBlock.toString());

                            if (dispatchError) {
                                reject(dispatchError);
                                return;
                            }
                        } else if (status.isFinalized) {
                            resolve();
                        } else if (status.isDropped || status.isInvalid) {
                            reject(new Error('Transaction was dropped or invalid'));
                        }
                    }
                ).catch(reject);
            });

            return true;
        } catch (err) {
            const errorDetails = handleError(err, 'Failed to claim tokens');
            setError(errorDetails);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [api, contract, selectedAccount, handleError]);

    // Check claim status - STABLE VERSION
    const checkClaimStatus = useCallback(async (address: string): Promise<ClaimStatus | null> => {
        if (!contract || !selectedAccount) {
            return null; // Don't set error here to avoid infinite loops
        }

        console.log("checking for claimed token")



        try {
            // Get gas estimations for each method
            const canClaimGasLimit = await estimateGas(
                api,
                contract,
                'canClaim',
                selectedAccount,
                [address]
            );

            const timeUntilGasLimit = await estimateGas(
                api,
                contract,
                'timeUntilNextClaim',
                selectedAccount,
                [address]
            );

            const lastClaimGasLimit = await estimateGas(
                api,
                contract,
                'getLastClaimTime',
                selectedAccount,
                [address]
            );
            const [canClaimResult, timeUntilResult, lastClaimResult] = await Promise.all([
                contract.query.canClaim(selectedAccount.address, {
                    gasLimit: canClaimGasLimit
                }, address),
                contract.query.timeUntilNextClaim(selectedAccount.address, {
                    gasLimit: timeUntilGasLimit
                }, address),
                contract.query.getLastClaimTime(selectedAccount.address, {
                    gasLimit: lastClaimGasLimit
                }, address)
            ]);

            if (isResultOk(canClaimResult) && isResultOk(timeUntilResult) && isResultOk(lastClaimResult)) {
                const canClaim = (canClaimResult.output as any).toJSON?.() ?? (canClaimResult.output as any);
                const timeUntil = (timeUntilResult.output as any).toJSON?.() ?? (timeUntilResult.output as any);
                const lastClaim = (lastClaimResult.output as any).toJSON?.() ?? (lastClaimResult.output as any);



                return {
                    canClaim: canClaim.ok,
                    timeUntilNextClaim: timeUntil.ok,
                    lastClaimTime: lastClaim.ok
                };
            }

            return null;
        } catch (err) {
            console.error('Failed to check claim status:', err);
            return null;
        }
    }, [contract, selectedAccount, api]); // Only depend on contract and selectedAccount

    // Get faucet configuration - STABLE VERSION
    const getFaucetConfig = useCallback(async (): Promise<FaucetConfig | null> => {
        if (!contract || !selectedAccount) return null;

        try {
            const result = await contract.query.getConfig(selectedAccount.address, {});

            if (isResultOk(result) && result.output) {
                const outputData = safeExtractOutput(result.output);
                const [tokenContract, distributionAmount, cooldownPeriod, totalDistributed, paused] =
                    Array.isArray(outputData) ? outputData : [];

                const configData: FaucetConfig = {
                    tokenContract: tokenContract || null,
                    distributionAmount: safeToString(distributionAmount),
                    cooldownPeriod: safeToString(cooldownPeriod),
                    totalDistributed: safeToString(totalDistributed),
                    paused: Boolean(paused)
                };

                return configData; // Don't call setConfig here directly
            }
        } catch (err) {
            console.error('Failed to get faucet config:', err);
        }

        return null;
    }, [contract, selectedAccount]); // Only depend on contract and selectedAccount

    // Get rate limits - FIXED CODEC ISSUES
    const getRateLimits = useCallback(async (): Promise<RateLimits | null> => {
        if (!contract || !selectedAccount) return null;

        try {
            const result = await contract.query.getRateLimits(selectedAccount.address, {});

            if (isResultOk(result) && result.output) {
                const outputData = safeExtractOutput(result.output);
                const [maxDaily, maxHourly, dailyDistributed, hourlyDistributed] =
                    Array.isArray(outputData) ? outputData : [];

                return {
                    maxDaily: safeToString(maxDaily),
                    maxHourly: safeToString(maxHourly),
                    dailyDistributed: safeToString(dailyDistributed),
                    hourlyDistributed: safeToString(hourlyDistributed)
                };
            }
        } catch (err) {
            console.error('Failed to get rate limits:', err);
        }

        return null;
    }, [contract, selectedAccount]);

    // Get token balance - FIXED CODEC ISSUES FOR NESTED RESULTS
    const getTokenBalance = useCallback(async (): Promise<string | null> => {
        if (!contract || !selectedAccount) return null;

        try {
            const result = await contract.query.getTokenBalance(selectedAccount.address, {});

            if (isResultOk(result) && result.output) {
                // Handle nested Result<Result<Balance, Error>, LangError> structure
                const nestedResult = safeExtractNestedResult(result);
                if (nestedResult) {
                    return safeToString(nestedResult);
                }

                // Fallback to direct output extraction
                return safeToString(result.output);
            }
        } catch (err) {
            console.error('Failed to get token balance:', err);
        }

        return null;
    }, [contract, selectedAccount]);

    // Format time remaining helper
    const formatTimeRemaining = useCallback((seconds: number): string => {
        if (seconds <= 0) return 'Available now';

        const hours = Math.floor(seconds / 3600 / 1000);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m ${remainingSeconds}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${remainingSeconds}s`;
        } else {
            return `${remainingSeconds}s`;
        }
    }, []);

    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Load initial config - FIXED TO PREVENT INFINITE LOOPS
    useEffect(() => {
        const loadConfig = async () => {
            if (contract && selectedAccount && !configLoadedRef.current) {
                configLoadedRef.current = true;
                try {
                    const configData = await getFaucetConfig();
                    if (configData) {
                        setConfig(configData);
                    }
                } catch (err) {
                    console.error('Failed to load initial config:', err);
                    configLoadedRef.current = false; // Reset on error so it can retry
                }
            }
        };

        loadConfig();
    }, [contract, selectedAccount]); // Remove getFaucetConfig from dependencies

    // Reset config loaded flag when contract or account changes
    useEffect(() => {
        configLoadedRef.current = false;
    }, [contract?.address, selectedAccount?.address]);

    return {
        isLoading,
        error,
        config,
        claimTokens,
        checkClaimStatus,
        getFaucetConfig,
        getRateLimits,
        getTokenBalance,
        clearError,
        formatTimeRemaining
    };
};

export default useTokenDistribution;