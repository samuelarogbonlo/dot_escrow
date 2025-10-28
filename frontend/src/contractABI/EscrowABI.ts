// Import the generated contract metadata
import contractMetadata from './EscrowABI.json';
import tokenMetadata from './TokenABI.json'

// Export the contract ABI metadata for use with Polkadot.js API
export const ESCROW_CONTRACT_ABI = contractMetadata;

export const TOKEN_CONTRACT_ABI = tokenMetadata;

// Export individual parts for convenience
export const { spec, types, storage } = contractMetadata;

// Contract address - deployed escrow contract on Pop Network (ink! v6 / pallet-revive)
// Using H160 (20-byte Ethereum-style) address format
export const ESCROW_CONTRACT_ADDRESS: string = '0x57c0082e71f89e1feb6b56ab36f0ae271c118019';

// PSP22 token contract deployed on Pop Network (ink! v6 / pallet-revive)
export const TOKEN_CONTRACT_ADDRESS: string = '0xd10852e9a6366cfab48f52e98f896344cbbc132c'

// Export default
export default contractMetadata;