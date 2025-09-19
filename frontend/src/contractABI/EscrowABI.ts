// Import the generated contract metadata
import contractMetadata from './EscrowABI.json';

// Export the contract ABI metadata for use with Polkadot.js API
export const ESCROW_CONTRACT_ABI = contractMetadata;

// Export individual parts for convenience
export const { spec, types, storage } = contractMetadata;

// Contract address - deployed escrow contract
export const ESCROW_CONTRACT_ADDRESS: string = '5CTJADbtMjtsWSFTNMq7vTkAcY5rUArZdvFpQkuDRoGTEggz';


// Export default
export default contractMetadata;