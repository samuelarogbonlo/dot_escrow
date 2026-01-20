import { useState, useCallback } from 'react';
import { ApiPromise } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { PSP22_TOKEN_ABI, TOKEN_CONTRACT_ADDRESS } from '@/contractABI/EscrowABI';
import { substrateToH160 } from '@/utils/substrateToH160';

// Default mint amount: 100,000 tokens with 10 decimals (matching TEST_USDT)
const DEFAULT_MINT_AMOUNT = '1000000000000000'; // 100,000 * 10^10

// Codec safety utilities
const isResultOk = (result: any): boolean => {
    if (!result || !result.result) return false;
    if (typeof result.result.isOk === 'boolean') return result.result.isOk;
    if (typeof result.result.isOk === 'function') return result.result.isOk();
    if (result.result.isOk?.valueOf) return result.result.isOk.valueOf() === true;
    return false;
};

const safeToString = (value: any): string => {
    if (value === null || value === undefined) return '0';
    let str = typeof value.toString === 'function' ? value.toString() : String(value);
    return str.replace(/,/g, '');
};

// Normalize PSP22 balance outputs into a clean numeric string
const extractBalanceValue = (output: any): string | null => {
    const normalize = (val: any): string | null => {
        const cleaned = safeToString(val).replace(/,/g, '').trim();
        return cleaned && /^[0-9]+$/.test(cleaned) ? cleaned : null;
    };

    if (!output) return null;

    // Standard Result style: isOk/asOk
    if (output.isOk && output.asOk !== undefined) {
        const normalized = normalize(output.asOk);
        if (normalized) return normalized;
    }

    // JSON representation may have Ok/ok
    const json = typeof output.toJSON === 'function' ? output.toJSON() : null;
    if (json !== null && json !== undefined) {
        const normalized = normalize((json as any).Ok ?? (json as any).ok ?? json);
        if (normalized) return normalized;
    }

    // Human representation (Ok + commas)
    const human = typeof output.toHuman === 'function' ? output.toHuman() : null;
    if (human !== null && human !== undefined) {
        const normalized = normalize((human as any).Ok ?? (human as any).ok ?? human);
        if (normalized) return normalized;
    }

    // Fallback to direct string conversion
    return normalize(output);
};

// Types
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
    isLoading: boolean;
    error: TokenDistributionError | null;
    config: FaucetConfig | null;
    claimTokens: (recipientAddress?: string) => Promise<boolean>;
    checkClaimStatus: (address: string) => Promise<ClaimStatus | null>;
    getFaucetConfig: () => Promise<FaucetConfig | null>;
    getRateLimits: () => Promise<RateLimits | null>;
    getTokenBalance: () => Promise<string | null>;
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
        const query = contract.query[methodName];
        if (!query) {
            return api.registry.createType('WeightV2', {
                refTime: 10000000000,
                proofSize: 1024 * 1024
            });
        }

        const { gasRequired, result } = await query(
            account.address,
            {
                gasLimit: api.registry.createType('WeightV2', {
                    refTime: 100000000000,
                    proofSize: 5 * 1024 * 1024
                }),
                storageDepositLimit: null,
            },
            ...args
        );

        if (result.isErr) {
            return api.registry.createType('WeightV2', {
                refTime: 30000000000,
                proofSize: 2 * 1024 * 1024
            });
        }

        const refTimeBuffer = gasRequired.refTime.toBn().muln(150).divn(100);
        const proofSizeBuffer = gasRequired.proofSize.toBn().muln(150).divn(100);

        return api.registry.createType('WeightV2', {
            refTime: refTimeBuffer.toString(),
            proofSize: proofSizeBuffer.toString()
        });

    } catch (error) {
        console.error(`[GasEstimation] Error:`, error);
        return api.registry.createType('WeightV2', {
            refTime: 30000000000,
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

    // Initialize PSP22 contract instance
    const getContract = useCallback(() => {
        if (!api) return null;
        return new ContractPromise(api as any, PSP22_TOKEN_ABI as any, TOKEN_CONTRACT_ADDRESS);
    }, [api]);

    const contract = getContract();

    // Error handling helper
    const handleError = useCallback((error: any, defaultMessage: string = 'An unknown error occurred'): TokenDistributionError => {
        console.error('Contract interaction error:', error);
        return {
            code: 'UnknownError',
            message: error?.message || defaultMessage
        };
    }, []);

    // Claim tokens using PSP22 mint function directly
    const claimTokens = useCallback(async (recipientAddress?: string): Promise<boolean> => {
        if (!api || !contract || !selectedAccount) {
            setError({ code: 'NetworkError', message: 'API, contract, or account not available' });
            return false;
        }

        setIsLoading(true);
        setError(null);

        console.log("Minting tokens via PSP22 contract...");

        try {
            const { web3FromSource } = await import('@polkadot/extension-dapp');
            const injector = await web3FromSource(selectedAccount.meta.source);
            api.setSigner(injector.signer as any);

            // Use recipient address or caller's address, converted to H160
            const mintTo = recipientAddress || selectedAccount.address;
            const mintToH160 = substrateToH160(mintTo);
            const mintAmount = DEFAULT_MINT_AMOUNT;

            console.log(`Minting ${mintAmount} tokens to ${mintToH160}`);

            // Estimate gas for mint
            const gasLimit = await estimateGas(
                api,
                contract,
                'mint',
                selectedAccount,
                [mintToH160, mintAmount]
            );

            // Execute mint transaction
            const tx = contract.tx.mint(
                { gasLimit },
                mintToH160,
                mintAmount
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
                            // Resolve on inBlock for faster UX (don't wait for finalized)
                            resolve();
                        } else if (status.isDropped || status.isInvalid) {
                            reject(new Error('Transaction was dropped or invalid'));
                        }
                    }
                ).catch(reject);
            });

            return true;
        } catch (err) {
            const errorDetails = handleError(err, 'Failed to mint tokens');
            setError(errorDetails);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [api, contract, selectedAccount, handleError]);

    // Check claim status - always return canClaim: true since PSP22 mint has no cooldown
    const checkClaimStatus = useCallback(async (address: string): Promise<ClaimStatus | null> => {
        // PSP22 mint has no cooldown, always available
        return {
            canClaim: true,
            timeUntilNextClaim: 0,
            lastClaimTime: null
        };
    }, []);

    // Get faucet configuration - return mock config for PSP22
    const getFaucetConfig = useCallback(async (): Promise<FaucetConfig | null> => {
        return {
            tokenContract: TOKEN_CONTRACT_ADDRESS,
            distributionAmount: DEFAULT_MINT_AMOUNT,
            cooldownPeriod: '0',
            totalDistributed: '0',
            paused: false
        };
    }, []);

    // Get rate limits - return mock data since PSP22 has no limits
    const getRateLimits = useCallback(async (): Promise<RateLimits | null> => {
        return {
            maxDaily: 'unlimited',
            maxHourly: 'unlimited',
            dailyDistributed: '0',
            hourlyDistributed: '0'
        };
    }, []);

    // Get user's token balance from PSP22
    const getTokenBalance = useCallback(async (): Promise<string | null> => {
        console.log('[getTokenBalance] Starting...', {
            hasApi: !!api,
            hasContract: !!contract,
            hasAccount: !!selectedAccount
        });

        if (!api || !contract || !selectedAccount) {
            console.log('[getTokenBalance] Missing dependencies, returning null');
            return null;
        }

        try {
            const addressH160 = substrateToH160(selectedAccount.address);
            console.log('[getTokenBalance] Querying balance for H160:', addressH160);

            // Use fixed gas limit to avoid estimation issues
            const gasLimit = api.registry.createType('WeightV2', {
                refTime: 100000000000,
                proofSize: 262144
            }) as any;

            const result = await contract.query.balanceOf(
                selectedAccount.address,
                { gasLimit, storageDepositLimit: null },
                addressH160
            );

            console.log('[getTokenBalance] Query result:', {
                isOk: result.result.isOk,
                hasOutput: !!result.output,
                outputHuman: result.output?.toHuman?.()
            });

            if (result.result.isOk && result.output) {
                const parsedBalance = extractBalanceValue(result.output);

                if (parsedBalance) {
                    console.log('[getTokenBalance] Parsed balance:', parsedBalance);
                    return parsedBalance;
                }

                console.warn('[getTokenBalance] Unable to parse balance output', {
                    outputHuman: result.output?.toHuman?.(),
                    outputJson: result.output?.toJSON?.()
                });
            } else {
                console.log('[getTokenBalance] Query failed:', result.result.toHuman?.());
            }
        } catch (err) {
            console.error('[getTokenBalance] Error:', err);
        }

        return null;
    }, [api, contract, selectedAccount]);

    // Format time remaining helper
    const formatTimeRemaining = useCallback((seconds: number): string => {
        if (seconds <= 0) return 'Available now';
        const hours = Math.floor(seconds / 3600000);
        const minutes = Math.floor((seconds % 3600000) / 60000);
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    }, []);

    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Mock config for display purposes
    const config: FaucetConfig = {
        tokenContract: TOKEN_CONTRACT_ADDRESS,
        distributionAmount: DEFAULT_MINT_AMOUNT,
        cooldownPeriod: '0',
        totalDistributed: '0',
        paused: false
    };

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
