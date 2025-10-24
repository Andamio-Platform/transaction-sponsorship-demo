# Transaction Sponsorship Demo

A Next.js 15 application demonstrating **gasless Cardano transactions** using the Andamio platform. Users can mint access tokens with aliases where transaction fees are sponsored by a backend wallet, enabling true zero-cost onboarding.

## Features

- **Transaction Sponsorship** - Backend wallet pays all transaction fees
- **Alias Minting** - Mint unique alias tokens on Cardano
- **Secure by Design** - API keys and credentials never exposed to browser
- **Plutus Smart Contracts** - Complex multi-token minting in single transaction
- **Dual Signing** - User + sponsor wallet signatures for complete security

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

**Required credentials:**
- Blockfrost API key (get from [blockfrost.io](https://blockfrost.io))
- Web3 SDK credentials (project ID, API key, private key) from [utxos.dev](https://utxos.dev)
- Access password for demo

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### 4. Build for Production

```bash
npm run build
npm start
```

## Documentation

Comprehensive documentation is available in the `/docs` directory:

- **[Security Architecture](./docs/security-architecture.md)** - How credentials are protected server-side
- **[Environment Variables](./docs/environment-variables.md)** - Complete configuration guide
- **[API Endpoints](./docs/api-endpoints.md)** - Server-side API reference
- **[Transaction Flow](./docs/transaction-flow.md)** - Step-by-step sponsorship process

See [/docs/README.md](./docs/README.md) for a complete overview.

## How It Works

1. **User connects wallet** and enters desired alias
2. **Password validation** happens server-side
3. **Transaction building** creates complex Plutus transaction on server
4. **Sponsorship** adds backend wallet UTXOs and signs
5. **User signs** with their wallet (for required signer hash)
6. **Submission** sends fully-signed transaction to blockchain

Result: User receives minted tokens + extra ADA without paying fees.

## Tech Stack

- **Next.js 15** - React framework with App Router
- **@meshsdk/core** - Cardano blockchain interaction
- **@andamiojs/sdk** - Andamio platform integration
- **@utxos/web3-sdk** - Server-side wallet management
- **Blockfrost** - Cardano API provider (preprod testnet)

## Security

This application implements a **server-side security model**:

- ✅ API keys never exposed to browser
- ✅ Password validation server-side only
- ✅ Transaction building uses secure credentials
- ✅ All Blockfrost calls happen server-side
- ✅ Proper separation of client/server responsibilities

See [Security Architecture](./docs/security-architecture.md) for details.

## Development

```bash
# Development server
npm run dev

# Type checking
npm run build

# Linting
npm run lint
```

## Project Structure

```
├── app/
│   ├── api/              # Server-side API routes
│   │   ├── build-transaction/
│   │   ├── parse-transaction/
│   │   ├── validate-password/
│   │   └── ...
│   └── page.tsx          # Main app page
├── components/
│   ├── mint-access-token/  # Token minting UI
│   ├── sponsor-account/    # Sponsor balance display
│   └── config.ts           # Configuration exports
├── docs/                 # Documentation
└── CLAUDE.md             # AI assistant instructions
```

## Important Notes

⚠️ **This is a demo application** using hardcoded configurations for the preprod testnet.

For production use:
- Move all secrets to proper secrets management
- Implement rate limiting on API routes
- Add user authentication
- Set up monitoring and logging
- Use separate credentials per environment

## Learn More

- [Andamio Platform](https://andamio.io)
- [MeshSDK Documentation](https://meshjs.dev)
- [UTXOS.dev](https://utxos.dev)
- [Blockfrost API](https://docs.blockfrost.io)
- [Cardano Documentation](https://docs.cardano.org)

## License

[Your License Here]
