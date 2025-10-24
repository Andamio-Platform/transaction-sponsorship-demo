# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 application demonstrating Cardano transaction sponsorship using the Andamio platform. The app allows users to mint access tokens where transaction fees are sponsored by a backend wallet, enabling gasless transactions for end users.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

The development server runs on `http://localhost:3000`.

## Core Architecture

### Transaction Sponsorship Flow

The application implements a three-step transaction sponsorship pattern:

1. **Build**: User initiates a transaction to mint an access token with alias
2. **Sponsor**: Server wallet adds UTXOs and signs the transaction to cover fees
3. **Submit**: User signs the final transaction and submits to blockchain

This flow is orchestrated in `components/mint-access-token/index.tsx:133-244` in the `handleBuildSponsorSubmit` function.

### Key Dependencies

- **@meshsdk/core & @meshsdk/react**: Cardano blockchain interaction and React hooks
- **@andamiojs/sdk**: Andamio platform integration for alias management and token minting
- **@utxos/web3-sdk**: Server-side wallet management for transaction sponsorship
- **Blockfrost**: Cardano blockchain API provider (preprod testnet)

### API Routes

All API routes use `export const dynamic = 'force-dynamic'` to prevent static optimization and ensure fresh data.

#### `/api/get-utxos` (GET)
Returns sponsor wallet's address, UTXOs, and collateral UTXOs. Implements anti-caching headers.

#### `/api/sign-transaction` (POST)
Signs a transaction using the sponsor wallet (server-side). Expects `{ unsignedTx }`.

#### `/api/submit-transaction` (POST)
Submits a signed transaction to Blockfrost. Expects `{ signedTx }`.

#### `/api/build-sponsored-tx` (POST)
Legacy route for building sponsored transactions. Currently not used in main flow.

#### `/api/sponsor-transaction` (POST)
Alternative sponsorship implementation. Currently not used in main flow.

#### `/api/alias-is-available` (GET)
Checks if an alias is available through Andamio indexer. Query param: `?alias=<name>`.

#### `/api/index-utxo` (GET)
Fetches the index UTXO for a given alias from Andamio indexer. Query param: `?alias=<name>`.

### Configuration

Configuration is in `components/config.ts`:
- `blockfrostApiKey`: Preprod testnet API key (hardcoded for demo)
- `andamioApi`: Andamio indexer endpoint
- `extraSponsorshipLovelace`: Amount sent to user (2 ADA)
- `REQUIRED_PASSWORD`: Access control for demo ("andamio2025")

**Important**: This demo uses hardcoded credentials. In production, move all secrets to environment variables.

### Transaction Building

The `buildTxSponsor` function in `components/mint-access-token/mint.ts` constructs complex Plutus transactions involving:
- Minting three different token types (index, global state, user tokens)
- Plutus script validation with datum/redeemer logic
- Stake address withdrawals for protocol observers
- Protocol fee payments to treasury

The transaction uses a universal static UTXO (`universalStaticUtxo`) which is filtered out during sponsorship to avoid double-spending.

### Wallet Integration

- **User Wallet**: Connected via MeshSDK's `useWallet` hook from `@meshsdk/react`
- **Sponsor Wallet**: Server-side wallet managed by `@utxos/web3-sdk` with hardcoded private key

The `ClientMeshProvider` component wraps the app and provides wallet context.

### WebAssembly Configuration

The `next.config.ts` enables WebAssembly support required by Cardano serialization libraries:
```typescript
config.experiments = {
  asyncWebAssembly: true,
  layers: true,
};
```

## Important Implementation Details

1. **UTxO Filtering**: When sponsoring transactions, the code filters out `universalStaticUtxo` from inputs to prevent conflicts between user-built and sponsor-modified transactions.

2. **Dual Signing**: Transactions require signatures from both user (for `requiredSignerHash`) and sponsor (for paying fees). The sponsor signs first via API, then user signs in browser.

3. **Datum Parsing**: The `parseAliasIndexDatum` function extracts alias information from Plutus datums using the UTxORPC spec format.

4. **Force Dynamic**: All routes and the main page use `export const dynamic = 'force-dynamic'` to disable Next.js static optimization, ensuring real-time blockchain data.

5. **Alias Locking**: The UI implements a lock mechanism requiring password validation before building transactions to prevent accidental submissions.

## Common Patterns

- API routes follow a consistent pattern: validate input → perform operation → return `{ success: boolean, data?: any, error?: string }`
- All blockchain operations use try-catch with detailed error logging
- Toast notifications (`sonner`) provide user feedback for all operations
- Components use React hooks for state management (no external state library)
