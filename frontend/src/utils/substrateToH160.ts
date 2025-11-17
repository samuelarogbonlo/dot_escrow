import { decodeAddress, keccakAsU8a } from '@polkadot/util-crypto';
import { u8aToHex,  } from '@polkadot/util';

/**
 * Converts a Substrate address to an H160 (Ethereum-style) address
 * using the same method as pallet-revive
 * @param substrateAddress - The Substrate address to convert
 * @returns The H160 address as a hex string
 */
export const substrateToH160 = (substrateAddress: string): string => {
  const publicKey = decodeAddress(substrateAddress);
  
  // Hash the full 32 bytes using Keccak-256
  const hash = keccakAsU8a(publicKey);
  
  // Take the LAST 20 bytes of the hash (not first!)
  const h160Address = u8aToHex(hash.slice(-20));
  
  return h160Address;
};