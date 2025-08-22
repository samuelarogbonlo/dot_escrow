// Import the generated contract metadata
import contractMetadata from './EscrowABI.json';

// Export the contract ABI metadata for use with Polkadot.js API
export const ESCROW_CONTRACT_ABI = contractMetadata;

// Export individual parts for convenience
export const { spec, types, storage } = contractMetadata;

// Contract address - deployed escrow contract
export const ESCROW_CONTRACT_ADDRESS: string = '5DSEPR6DWLgp3mGzcU9Q5VDCJuoYvedTE3a7dab8uiLfFCyj';

// Function to set contract address after deployment (for future use)
export const setEscrowContractAddress = (address: string) => {
  // Note: This is now a constant, but keeping the function for compatibility
  console.log('Contract address is now a constant:', ESCROW_CONTRACT_ADDRESS);
};

// Export default
export default contractMetadata;