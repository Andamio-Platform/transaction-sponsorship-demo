# Security Architecture

## Overview

This application implements a server-side security model where sensitive credentials never reach the browser. All operations requiring API keys or passwords are executed server-side via Next.js API routes.

## Architecture Diagram

```
┌─────────────────┐
│  Browser/Client │
└────────┬────────┘
         │ (No API keys exposed)
         │
         ▼
┌─────────────────┐
│   API Routes    │ ← BLOCKFROST_API_KEY
│  (Server-side)  │ ← REQUIRED_PASSWORD
└────────┬────────┘ ← WEB3_SDK credentials
         │
         ▼
┌─────────────────┐
│  Blockfrost API │
│  Cardano Chain  │
└─────────────────┘
```

## Security Layers

### 1. Password Validation
**Before:** Password compared in browser (exposed in JS bundle)
**After:** Password sent to `/api/validate-password`, compared server-side

### 2. Transaction Building
**Before:** Blockfrost API key used in client component to build transactions
**After:** Client calls `/api/build-transaction`, all Blockfrost calls happen server-side

### 3. Transaction Parsing
**Before:** Blockfrost provider initialized with exposed API key
**After:** Client sends transaction data to `/api/parse-transaction` for server-side parsing

### 4. Sponsorship Operations
All wallet operations (getting UTXOs, signing, submitting) happen server-side:
- `/api/get-utxos` - Fetch sponsor wallet UTXOs
- `/api/sign-transaction` - Sign with sponsor wallet
- `/api/submit-transaction` - Submit to blockchain

## Client Responsibilities

The client (browser) only:
- Collects user input (alias, password)
- Connects user's wallet
- Signs transactions with user's wallet (for `requiredSignerHash`)
- Displays transaction status

## Server Responsibilities

The server handles all:
- Credential validation
- Blockfrost API interactions
- Complex Plutus transaction building
- Sponsor wallet operations
- Transaction submission

## Environment Variable Safety

### ✅ Safe for Client (NEXT_PUBLIC_*)
- `NEXT_PUBLIC_ANDAMIO_API` - Public API endpoint

### ❌ Never Expose to Client
- `BLOCKFROST_API_KEY` - Blockchain API key
- `REQUIRED_PASSWORD` - Access control password
- `EXTRA_SPONSORSHIP_LOVELACE` - Business logic parameter
- `WEB3_SDK_*` - Sponsor wallet credentials

## Benefits

1. **No credential leakage** - Secrets never in client bundle
2. **Rate limiting possible** - Server can implement rate limiting
3. **Audit trail** - All sensitive operations logged server-side
4. **Easy to extend** - Add authentication, logging, monitoring at API level
5. **Production ready** - Proper separation of concerns
