import { decodeAddress, encodeAddress } from '@polkadot/keyring';
import { hexToU8a, isHex } from '@polkadot/util';

// Polkadot network prefixes
export const POLKADOT_NETWORKS = {
  POLKADOT: 0,      // Polkadot mainnet
  KUSAMA: 2,        // Kusama
  WESTEND: 42,      // Westend testnet
  ROCOCO: 42,       // Rococo testnet
  GENERIC: 42       // Generic substrate
} as const;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  network?: string;
  normalizedAddress?: string;
}

/**
 * Validates a Polkadot/Substrate address using SS58 format
 */
export const validatePolkadotAddress = (address: string): ValidationResult => {
  if (!address || typeof address !== 'string') {
    return { isValid: false, error: 'Address is required' };
  }

  // Remove whitespace
  const trimmedAddress = address.trim();
  
  if (trimmedAddress.length === 0) {
    return { isValid: false, error: 'Address cannot be empty' };
  }

  // Check basic format - SS58 addresses typically start with specific characters
  if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(trimmedAddress)) {
    return { isValid: false, error: 'Invalid characters in address' };
  }

  // Check length (SS58 addresses are typically 47-48 characters)
  if (trimmedAddress.length < 47 || trimmedAddress.length > 48) {
    return { isValid: false, error: 'Invalid address length' };
  }

  try {
    // Decode the address to validate SS58 format
    const decoded = decodeAddress(trimmedAddress);
    
    // Check if decoded address is valid (should be 32 bytes)
    if (decoded.length !== 32) {
      return { isValid: false, error: 'Invalid address format' };
    }

    // Try to determine the network by checking the first character
    let network = 'Unknown';
    if (trimmedAddress.startsWith('1') || trimmedAddress.startsWith('12') || trimmedAddress.startsWith('13') || trimmedAddress.startsWith('14') || trimmedAddress.startsWith('15')) {
      network = 'Polkadot';
    } else if (trimmedAddress.startsWith('C') || trimmedAddress.startsWith('D') || trimmedAddress.startsWith('E') || trimmedAddress.startsWith('F') || trimmedAddress.startsWith('G') || trimmedAddress.startsWith('H')) {
      network = 'Kusama';
    } else if (trimmedAddress.startsWith('5')) {
      network = 'Generic Substrate';
    }

    // Re-encode to ensure consistency
    const normalizedAddress = encodeAddress(decoded, POLKADOT_NETWORKS.POLKADOT);

    return {
      isValid: true,
      network,
      normalizedAddress: trimmedAddress // Keep original format if valid
    };

  } catch (error) {
    // Handle specific SS58 decoding errors
    const errorMessage = error instanceof Error ? error.message : 'Invalid address format';
    
    if (errorMessage.includes('checksum')) {
      return { isValid: false, error: 'Invalid address checksum' };
    }
    if (errorMessage.includes('length')) {
      return { isValid: false, error: 'Invalid address length' };
    }
    if (errorMessage.includes('prefix')) {
      return { isValid: false, error: 'Invalid network prefix' };
    }
    
    return { isValid: false, error: 'Invalid Polkadot address format' };
  }
};

/**
 * Check if address is specifically a Polkadot mainnet address
 */
export const isPolkadotMainnetAddress = (address: string): boolean => {
  const validation = validatePolkadotAddress(address);
  return validation.isValid && validation.network === 'Polkadot';
};

/**
 * Format address for display (truncate middle)
 */
export const formatAddressForDisplay = (address: string, startChars = 6, endChars = 6): string => {
  if (address.length <= startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};
