// Import the generated contract metadata
import contractMetadata from './EscrowABI.json';

// Export the contract ABI metadata for use with Polkadot.js API
export const ESCROW_CONTRACT_ABI = contractMetadata;

// Export individual parts for convenience
export const { spec, types, storage } = contractMetadata;

// Contract address will be set after deployment
export let ESCROW_CONTRACT_ADDRESS: string = '';

// Function to set contract address after deployment
export const setEscrowContractAddress = (address: string) => {
  ESCROW_CONTRACT_ADDRESS = address;
};

// Export default
export default contractMetadata;