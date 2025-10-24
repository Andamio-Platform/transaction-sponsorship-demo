# API Endpoints

All endpoints return JSON with format: `{ success: boolean, data?: any, error?: string }`

## Security Endpoints

### POST /api/validate-password

Validates the access password server-side.

**Request:**
```json
{
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true
  }
}
```

**Used by:** Password lock mechanism in client

---

## Transaction Building Endpoints

### POST /api/build-transaction

Builds the complete Plutus transaction for minting alias tokens.

**Request:**
```json
{
  "userAddress": "addr_test1...",
  "alias": "my-alias"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transaction": "84a7008...CBOR hex",
    "universalStaticUtxo": {
      "input": { "txHash": "...", "outputIndex": 0 },
      "output": { "address": "...", "amount": [...] }
    }
  }
}
```

**Operations:**
- Fetches user UTXOs from Blockfrost
- Queries Andamio indexer for alias availability
- Builds complex Plutus transaction with:
  - Index token minting
  - Global state token minting
  - User token minting
  - Protocol fee payment
  - Stake address withdrawals

**Used by:** Step 1 of build-sponsor-submit flow

---

### POST /api/parse-transaction

Parses and modifies a transaction for sponsorship.

**Request:**
```json
{
  "builtTx": "84a7008...CBOR hex",
  "sponsorAddress": "addr_test1...",
  "collateralUtxos": [...],
  "utxos": [...],
  "universalStaticUtxo": { ... }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "unsignedTx": "84a8009...CBOR hex"
  }
}
```

**Operations:**
- Parses transaction with Blockfrost provider
- Filters out universal static UTxO
- Adds sponsor UTXOs and collateral
- Sets sponsor as change address
- Recomputes fees

**Used by:** Step 2 of build-sponsor-submit flow

---

## Wallet Operations

### GET /api/get-utxos

Fetches sponsor wallet UTXOs and address.

**Response:**
```json
{
  "success": true,
  "data": {
    "sponsorAddress": "addr_test1...",
    "collateralUtxos": [...],
    "utxos": [...]
  }
}
```

**Caching:** Disabled with cache-control headers

---

### POST /api/sign-transaction

Signs transaction with sponsor wallet.

**Request:**
```json
{
  "unsignedTx": "84a8009...CBOR hex"
}
```

**Response:**
```json
{
  "success": true,
  "data": "84a9010...signed CBOR hex"
}
```

**Note:** Returns partially signed transaction (sponsor signature only). User must also sign.

---

### POST /api/submit-transaction

Submits fully-signed transaction to blockchain.

**Request:**
```json
{
  "signedTx": "84aa012...CBOR hex"
}
```

**Response:**
```json
{
  "success": true,
  "data": "abc123...transaction hash"
}
```

**Operations:**
- Submits via Blockfrost
- Returns transaction hash for tracking

---

## Utility Endpoints

### GET /api/alias-is-available?alias=my-alias

Checks if an alias is available via Andamio indexer.

**Response:**
```json
{
  "success": true,
  "data": {
    "checkStatus": {
      "isAvailable": true
    }
  }
}
```

---

### GET /api/index-utxo?alias=my-alias

Fetches the index UTxO for a given alias.

**Response:**
```json
{
  "success": true,
  "data": {
    "indexUtxotxOutRef": [
      {
        "tx_hash": "abc123...",
        "index": 0
      }
    ]
  }
}
```

---

## Legacy Endpoints

These endpoints exist but are not used in the current flow:

- POST `/api/build-sponsored-tx` - Old sponsorship method
- POST `/api/sponsor-transaction` - Alternative sponsorship implementation

## Error Handling

All endpoints follow consistent error format:

```json
{
  "success": false,
  "error": "Descriptive error message"
}
```

HTTP status codes:
- `400` - Bad request (missing parameters)
- `500` - Server error (configuration, blockchain, etc.)
- `200` - Success (even if success: false for validation failures)
