// Import the generated contract metadata
import contractMetadata from './EscrowABI.json';
import tokenMetadata from './TokenABI.json'

// Export the contract ABI metadata for use with Polkadot.js API
export const ESCROW_CONTRACT_ABI = contractMetadata;

export const TOKEN_CONTRACT_ABI = tokenMetadata;

// Export individual parts for convenience
export const { spec, types, storage } = contractMetadata;

// Contract address - deployed escrow contract
export const ESCROW_CONTRACT_ADDRESS: string = '5Fz1QCwsGD3q2ZuVToSGUcrrDKmKr23PUh8NVi31pW6vwzSU';

export const TOKEN_CONTRACT_ADDRESS: string = '5HgzgGY4c4VLUy8MdhwXxXPg62eps8kRBuv2aoQwBuzNtPHL'

// Export default
export default contractMetadata;