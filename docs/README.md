# Transaction Sponsorship Documentation

This directory contains documentation for the transaction sponsorship security implementation.

## Contents

- **[security-architecture.md](./security-architecture.md)** - Overview of how sensitive credentials are protected
- **[environment-variables.md](./environment-variables.md)** - Environment variable configuration guide
- **[api-endpoints.md](./api-endpoints.md)** - Server-side API endpoints reference
- **[transaction-flow.md](./transaction-flow.md)** - Step-by-step transaction sponsorship process

## Quick Start

1. Copy `.env.example` to `.env`
2. Fill in your credentials (never use `NEXT_PUBLIC_` prefix for secrets)
3. Run `npm run dev`

## Security Principles

- **API keys never exposed to browser** - All Blockfrost API calls happen server-side
- **Password validation server-side only** - Password never included in client bundle
- **Transaction building secured** - Complex Plutus transactions built on server
- **Principle of least privilege** - Client only receives what it needs
