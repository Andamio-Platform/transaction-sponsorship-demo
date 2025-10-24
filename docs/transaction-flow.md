# Transaction Sponsorship Flow

## Overview

The transaction sponsorship flow allows users to mint tokens without paying transaction fees. A backend wallet (sponsor) covers all costs.

## Three-Step Process

### Step 1: Build
User initiates transaction with their wallet connected.

```
Client → POST /api/build-transaction
        { userAddress, alias }

Server → Builds Plutus transaction
         - Queries Andamio for alias
         - Mints 3 token types
         - Adds protocol fees
         - Sets user as required signer

Server → Client
        { transaction, universalStaticUtxo }
```

### Step 2: Sponsor
Server wallet adds inputs and signs.

```
Client → GET /api/get-utxos

Server → Client
        { sponsorAddress, utxos, collateralUtxos }

Client → POST /api/parse-transaction
        { builtTx, sponsorAddress, utxos, collateralUtxos, universalStaticUtxo }

Server → Parses transaction
         - Filters out static UTxO
         - Adds sponsor UTxOs
         - Adds collateral
         - Recomputes fees

Server → Client
        { unsignedTx }

Client → POST /api/sign-transaction
        { unsignedTx }

Server → Signs with sponsor wallet

Server → Client
        { signedTx (partial) }

Client → User signs in browser
        wallet.signTx(signedTx, true)

Client → signedTx (fully signed)
```

### Step 3: Submit
Transaction submitted to blockchain.

```
Client → POST /api/submit-transaction
        { signedTx }

Server → Submits to Blockfrost

Server → Client
        { txHash }
```

## User Journey

### UI Flow

1. **Connect Wallet**
   - User connects Cardano wallet (Nami, Eternl, etc.)
   - Client fetches and displays address

2. **Enter Alias**
   - User types desired alias
   - Client validates format

3. **Lock Alias**
   - Client calls `/api/alias-is-available`
   - User enters password
   - Client calls `/api/validate-password`
   - If valid, alias is "locked" for minting

4. **Build & Submit**
   - User clicks "Build & Submit" button
   - All 3 steps execute automatically
   - Progress shown: "Building..." → "Sponsoring..." → "Submitting..."

5. **Confirmation**
   - Transaction hash displayed
   - User receives:
     - Minted user token (alias NFT)
     - Extra ADA (sponsorship amount)

## Technical Details

### Dual Signing

Transactions require TWO signatures:

1. **Sponsor Signature** (server-side)
   - Signs with sponsor wallet private key
   - Authorizes spending sponsor UTxOs
   - Covers transaction fees

2. **User Signature** (client-side)
   - Signs with user's wallet
   - Required for `requiredSignerHash` in Plutus script
   - Proves user authorization

### UTxO Management

**Universal Static UTxO:**
- Pre-defined UTxO used as temporary input
- Filtered out during sponsorship
- Prevents conflicts between user and sponsor inputs

**Collateral:**
- Required for Plutus scripts
- Provided by sponsor wallet
- Returned if transaction succeeds

**Change Address:**
- Set to sponsor address
- Sponsor receives change from transaction

### Token Minting

Three tokens minted in one transaction:

1. **Index Token** (`20` suffix)
   - Links alias to next available slot
   - Stored in index validator

2. **Global State Token** (`313030` + alias hex)
   - Records alias ownership
   - Stored in global state validator

3. **User Token** (`323232` + alias hex)
   - User's access token (NFT)
   - Sent to user's address
   - Proves alias ownership

### Protocol Fees

- Paid to protocol treasury address
- Amount determined by Andamio protocol
- Automatically included in transaction

### Observers

- Stake address withdrawal triggers Plutus observer
- Validates transaction according to protocol rules
- Zero-amount withdrawal (0 lovelace)

## Error Handling

### Common Failures

**"Alias already taken"**
- Another user claimed alias first
- Choose different alias

**"Incorrect password"**
- Server-side validation failed
- Re-enter correct password

**"Failed to build transaction"**
- Blockchain state changed
- Alias may have been claimed
- Retry or choose new alias

**"Failed to sign transaction"**
- User rejected wallet signature
- Sponsor wallet issue
- Check wallet connection

**"Failed to submit transaction"**
- Network congestion
- Insufficient UTxOs
- Check Blockfrost status

## Code Reference

**Client component:** `components/mint-access-token/index.tsx`
- Function: `handleBuildSponsorSubmit` (lines 136-224)

**Transaction building:** `app/api/build-transaction/route.ts`
- Implements complete Plutus transaction construction

**Transaction parsing:** `app/api/parse-transaction/route.ts`
- Modifies transaction for sponsorship

## Timing

Typical flow duration:
- Build: 2-5 seconds
- Sponsor: 3-6 seconds (includes parsing + signing)
- Submit: 1-3 seconds

Total: ~10 seconds from click to confirmation
