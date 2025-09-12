// Import the generated contract metadata
import contractMetadata from './EscrowABI.json';

// Export the contract ABI metadata for use with Polkadot.js API
export const ESCROW_CONTRACT_ABI = contractMetadata;

// Export individual parts for convenience
export const { spec, types, storage } = contractMetadata;

// Contract address - deployed escrow contract
export const ESCROW_CONTRACT_ADDRESS: string = '5DUhoanHDv6pkQbeSu2vbR7zYve1W1Zu5hG2sT5AB5h3i3Mo';

// Function to set contract address after deployment (for future use)
export const setEscrowContractAddress = (address: string) => {
  // Note: This is now a constant, but keeping the function for compatibility
  console.log('Contract address is now a constant:', ESCROW_CONTRACT_ADDRESS);
};

// Export default
export default contractMetadata;