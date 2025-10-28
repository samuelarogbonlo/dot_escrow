/**
 * Address Conversion Utilities for ink! v6 pallet-revive
 *
 * Handles conversion between Substrate SS58 addresses (32-byte) and
 * Ethereum-style H160 addresses (20-byte) required by pallet-revive.
 */

import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';
import { u8aToHex, hexToU8a, isHex } from '@polkadot/util';

/**
 * Default SS58 format for Polkadot addresses
 * 0 = Polkadot, 42 = Generic Substrate
 */
const DEFAULT_SS58_FORMAT = 42;

/**
 * Converts a Substrate SS58 address to H160 (20-byte Ethereum-style) format
 *
 * @param ss58Address - The SS58 encoded address (e.g., "5GGj87DtUuzRBeKNvasqw2Y15jDWANxTsZKS81C8wk9GnSNm")
 * @returns H160 address as hex string with 0x prefix (e.g., "0x1234...abcd")
 * @throws Error if address is invalid
 */
export function ss58ToH160(ss58Address: string): string {
  try {
    // Decode SS58 address to raw bytes (32-byte public key)
    const publicKey = decodeAddress(ss58Address);

    // Take last 20 bytes for H160 (Ethereum-style address)
    // This matches pallet-revive's account mapping logic
    const h160Bytes = publicKey.slice(-20);

    // Convert to hex string with 0x prefix
    return u8aToHex(h160Bytes);
  } catch (error) {
    throw new Error(`Invalid SS58 address: ${ss58Address}. ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Converts an H160 (20-byte) address to SS58 format for display
 *
 * Note: This is a lossy conversion - the original 32-byte SS58 address cannot be
 * perfectly reconstructed from a 20-byte H160. Use this only for display purposes.
 *
 * @param h160Address - The H160 address (with or without 0x prefix)
 * @param ss58Format - Optional SS58 format (default: 42 for generic Substrate)
 * @returns SS58 encoded address
 * @throws Error if address is invalid
 */
export function h160ToSS58(h160Address: string, ss58Format: number = DEFAULT_SS58_FORMAT): string {
  try {
    // Remove 0x prefix if present
    const cleanAddress = h160Address.startsWith('0x') ? h160Address.slice(2) : h160Address;

    // Validate length (20 bytes = 40 hex chars)
    if (cleanAddress.length !== 40) {
      throw new Error(`H160 address must be 40 hex characters (20 bytes), got ${cleanAddress.length}`);
    }

    // Convert hex to bytes
    const h160Bytes = hexToU8a(`0x${cleanAddress}`);

    // Pad to 32 bytes by prepending zeros (this is a display-only approximation)
    const paddedBytes = new Uint8Array(32);
    paddedBytes.set(h160Bytes, 12); // Place H160 bytes at the end

    // Encode as SS58
    return encodeAddress(paddedBytes, ss58Format);
  } catch (error) {
    throw new Error(`Invalid H160 address: ${h160Address}. ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Validates if a string is a valid H160 address
 *
 * @param address - The address to validate
 * @returns true if valid H160 format
 */
export function isH160(address: string): boolean {
  try {
    // Check if it's a hex string
    if (!isHex(address)) {
      return false;
    }

    // Remove 0x prefix if present
    const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;

    // H160 must be exactly 40 hex characters (20 bytes)
    return cleanAddress.length === 40;
  } catch {
    return false;
  }
}

/**
 * Validates if a string is a valid SS58 address
 *
 * @param address - The address to validate
 * @returns true if valid SS58 format
 */
export function isSS58(address: string): boolean {
  try {
    // Try to decode - will throw if invalid
    decodeAddress(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Formats an H160 address for display (shortens middle)
 *
 * @param h160Address - The H160 address to format
 * @param prefixLength - Number of characters to show at start (default: 6)
 * @param suffixLength - Number of characters to show at end (default: 4)
 * @returns Formatted address (e.g., "0x1234...abcd")
 */
export function formatH160(h160Address: string, prefixLength: number = 6, suffixLength: number = 4): string {
  if (!isH160(h160Address)) {
    return h160Address;
  }

  const cleanAddress = h160Address.startsWith('0x') ? h160Address : `0x${h160Address}`;

  if (cleanAddress.length <= prefixLength + suffixLength + 2) {
    return cleanAddress;
  }

  return `${cleanAddress.slice(0, prefixLength + 2)}...${cleanAddress.slice(-suffixLength)}`;
}

/**
 * Formats an SS58 address for display (shortens middle)
 *
 * @param ss58Address - The SS58 address to format
 * @param prefixLength - Number of characters to show at start (default: 6)
 * @param suffixLength - Number of characters to show at end (default: 4)
 * @returns Formatted address (e.g., "5GGj87...nSNm")
 */
export function formatSS58(ss58Address: string, prefixLength: number = 6, suffixLength: number = 4): string {
  if (!isSS58(ss58Address)) {
    return ss58Address;
  }

  if (ss58Address.length <= prefixLength + suffixLength) {
    return ss58Address;
  }

  return `${ss58Address.slice(0, prefixLength)}...${ss58Address.slice(-suffixLength)}`;
}

/**
 * Detects the address format (SS58 or H160)
 *
 * @param address - The address to detect
 * @returns 'ss58', 'h160', or 'unknown'
 */
export function detectAddressFormat(address: string): 'ss58' | 'h160' | 'unknown' {
  if (isH160(address)) {
    return 'h160';
  }
  if (isSS58(address)) {
    return 'ss58';
  }
  return 'unknown';
}

/**
 * Converts any address format to H160
 * Auto-detects if the input is SS58 or already H160
 *
 * @param address - SS58 or H160 address
 * @returns H160 address
 * @throws Error if address is invalid
 */
export function toH160(address: string): string {
  const format = detectAddressFormat(address);

  switch (format) {
    case 'h160':
      return address.startsWith('0x') ? address : `0x${address}`;
    case 'ss58':
      return ss58ToH160(address);
    default:
      throw new Error(`Invalid address format: ${address}`);
  }
}

/**
 * Error class for address conversion failures
 */
export class AddressConversionError extends Error {
  constructor(message: string, public readonly address: string) {
    super(message);
    this.name = 'AddressConversionError';
  }
}
