# Deploying .escrow to Paseo Testnet

This guide walks you through deploying the .escrow smart contracts to Paseo testnet and configuring the frontend.

## Prerequisites

- Rust and cargo installed
- Node.js 18+ installed
- A Polkadot wallet (Polkadot.js, SubWallet, or Talisman)
- PAS tokens from the [Polkadot Faucet](https://faucet.polkadot.io/)

## Step 1: Install Pop CLI

```bash
cargo install --locked --git https://github.com/r0gue-io/pop-cli
```

## Step 2: Build Your Contracts

### Build Escrow Contract
```bash
cd contracts/escrow
cargo contract build --release
```

This generates:
- `target/ink/escrow_contract.contract` - Compiled contract bundle
- `target/ink/escrow_contract.wasm` - WebAssembly bytecode
- `target/ink/metadata.json` - Contract metadata

### Build Token Contract (if you have a custom token)
```bash
cd ../token  # or wherever your token contract is
cargo contract build --release
```

## Step 3: Get Test Tokens

1. Visit [Polkadot Faucet](https://faucet.polkadot.io/)
2. Select "Paseo" network
3. Enter your wallet address
4. Request PAS tokens (testnet native tokens)

## Step 4: Deploy Contracts to Paseo

### Option A: Using Pop CLI (Recommended)

```bash
# Deploy Escrow Contract
cd contracts/escrow
pop up contract \
  --constructor new \
  --args "50 <multisig_admins> <multisig_threshold>" \
  --url wss://rpc1.paseo.popnetwork.xyz \
  --suri "//YourAccountSeed"

# Note the deployed contract address from output
# Example: Contract deployed at: 5GvRMZSLS6UzHwExFuw5Fw9Ybic1gRdWH9LFy79ssDbDiWvU
```

**Constructor Arguments:**
- `fee_bps`: Platform fee in basis points (e.g., 50 = 0.5%)
- `multisig_admins`: Array of admin addresses
- `multisig_threshold`: Number of signatures required

### Option B: Using Substrate Contracts UI

1. Visit [https://contracts-ui.substrate.io/](https://contracts-ui.substrate.io/)
2. Select "Pop Network" from the network dropdown
3. Click "Add New Contract"
4. Upload your `.contract` file from `target/ink/`
5. Select constructor and provide arguments
6. Click "Deploy" and sign the transaction
7. Copy the deployed contract address

## Step 5: Update Frontend Configuration

### Update Contract Addresses

Edit `frontend/src/contractABI/EscrowABI.ts`:

```typescript
export const ESCROW_CONTRACT_ADDRESS: string = '<YOUR_PASEO_ESCROW_ADDRESS>';
export const TOKEN_CONTRACT_ADDRESS: string = '<YOUR_PASEO_TOKEN_ADDRESS>';
```

### Verify Network Settings

The frontend is already configured with Paseo endpoints. Check `frontend/src/hooks/usePolkadotApi.ts`:

```typescript
const DEFAULT_ENDPOINT = ENDPOINTS.PASEO_POP; // Should be set to Paseo
```

## Step 6: Test Your Deployment

### Local Testing
```bash
cd frontend
npm install
npm run dev
```

### Connect and Test
1. Open your browser to `http://localhost:5173`
2. Click "Connect Wallet"
3. Approve the connection in your wallet extension
4. Select your account
5. Verify network shows "Paseo Testnet (Pop Network)"
6. Try creating a test escrow

## Step 7: Deploy Frontend

### Build for Production
```bash
cd frontend
npm run build
```

### Deploy to Hosting
Upload the `dist/` folder to your hosting provider:
- Vercel
- Netlify
- GitHub Pages
- Railway
- Any static hosting service

### Update Environment Variables
If using environment variables, ensure they're set on your hosting platform:
```
VITE_ESCROW_CONTRACT_ADDRESS=<your_paseo_address>
VITE_TOKEN_CONTRACT_ADDRESS=<your_token_address>
VITE_RPC_URL=wss://rpc1.paseo.popnetwork.xyz
```

## Verification Checklist

- [ ] Smart contracts built successfully
- [ ] Contracts deployed to Paseo Pop Network
- [ ] Contract addresses updated in `EscrowABI.ts`
- [ ] Frontend connects to Paseo network by default
- [ ] Network selector shows Paseo as recommended
- [ ] Can create escrow transactions on Paseo
- [ ] Can complete milestones on Paseo
- [ ] README updated with Paseo deployment info

## Troubleshooting

### "Failed to connect to RPC"
- Verify the RPC endpoint is correct: `wss://rpc1.paseo.popnetwork.xyz`
- Check your internet connection
- Try alternative endpoint: `wss://paseo.rpc.amforc.com:443`

### "Insufficient balance"
- Request more PAS tokens from the faucet
- Wait a few minutes for tokens to arrive

### "Contract not found"
- Double-check the contract address in `EscrowABI.ts`
- Verify contract was deployed to Pop Network (not relay chain)

### "Transaction failed"
- Ensure you have enough PAS for gas fees
- Check contract constructor arguments are correct
- Review contract error messages in browser console

## Additional Resources

- [Pop Network Documentation](https://learn.onpop.io/)
- [ink! Documentation](https://use.ink/)
- [Paseo Network Info](https://github.com/paseo-network)
- [Substrate Contracts UI](https://contracts-ui.substrate.io/)

## Support

For issues specific to Paseo deployment, please open an issue on GitHub or contact the team.
