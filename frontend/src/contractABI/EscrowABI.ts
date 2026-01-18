// Import the generated contract metadata
import contractMetadata from './EscrowABI.json';
import tokenMetadata from './TokenABI.json'
import psp22TokenMetadata from './PSP22Token.json'

// Export the contract ABI metadata for use with Polkadot.js API
export const ESCROW_CONTRACT_ABI = contractMetadata;

export const TOKEN_CONTRACT_ABI = tokenMetadata;

export const PSP22_TOKEN_ABI = psp22TokenMetadata;

// Export individual parts for convenience
export const { spec, types, storage } = contractMetadata;

// Contract address - Pop Network PolkaVM (H160 / 20 bytes)
export const ESCROW_CONTRACT_ADDRESS: string = '0x027a592ae13B21f54AB2130B1a4649a36C566ef6';
console.log("contract escrow address",ESCROW_CONTRACT_ADDRESS)


// PSP22 token contract address (H160). If unknown, the frontend will fetch via get_usdt_token
export const TOKEN_CONTRACT_ADDRESS: string = '0x72744B75567f11016F2287f75597a29E14017f83'


// Export default
export default contractMetadata;