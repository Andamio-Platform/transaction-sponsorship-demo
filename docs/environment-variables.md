# Environment Variables

## Configuration File

Copy `.env.example` to `.env` and fill in your values.

## Client-Side Variables

These use the `NEXT_PUBLIC_` prefix and are embedded in the browser bundle.

### NEXT_PUBLIC_ANDAMIO_API
- **Type:** URL
- **Default:** `https://indexer-preprod-507341199760.us-central1.run.app`
- **Description:** Public Andamio indexer endpoint for alias lookups

## Server-Side Variables

These **must NOT** use the `NEXT_PUBLIC_` prefix. They are only accessible in API routes and server components.

### BLOCKFROST_API_KEY
- **Type:** String (API key)
- **Required:** Yes
- **Description:** Blockfrost API key for Cardano preprod testnet
- **Get it from:** https://blockfrost.io/
- **Usage:** All blockchain operations (fetching UTXOs, parsing transactions, submitting)

### REQUIRED_PASSWORD
- **Type:** String
- **Required:** Yes
- **Description:** Password required to authorize alias minting
- **Security:** Never log or expose this value
- **Usage:** Validated server-side via `/api/validate-password`

### EXTRA_SPONSORSHIP_LOVELACE
- **Type:** Number (lovelace)
- **Default:** `2000000` (2 ADA)
- **Description:** Amount of lovelace sent to user along with minted tokens
- **Usage:** Transaction building in `/api/build-transaction`

### WEB3_SDK_PROJECT_ID
- **Type:** String (UUID)
- **Required:** Yes
- **Description:** Web3 SDK project identifier
- **Usage:** Initialize sponsor wallet SDK

### WEB3_SDK_API_KEY
- **Type:** String (API key)
- **Required:** Yes
- **Description:** Web3 SDK API key
- **Usage:** Authenticate with Web3 SDK

### WEB3_SDK_NETWORK
- **Type:** Enum (`testnet` | `mainnet`)
- **Required:** Yes
- **Description:** Cardano network for sponsor wallet
- **Usage:** SDK configuration

### WEB3_SDK_PRIVATE_KEY
- **Type:** String (hex-encoded private key)
- **Required:** Yes
- **Description:** Private key for sponsor wallet that pays transaction fees
- **Security:** CRITICAL - Never commit to git or expose
- **Usage:** Sign transactions with sponsor wallet

## Migration from Old Configuration

If upgrading from the old configuration, rename these variables:

```bash
# Old → New
NEXT_PUBLIC_BLOCKFROST_API_KEY → BLOCKFROST_API_KEY
NEXT_PUBLIC_REQUIRED_PASSWORD → REQUIRED_PASSWORD
NEXT_PUBLIC_EXTRA_SPONSORSHIP_LOVELACE → EXTRA_SPONSORSHIP_LOVELACE
```

## Validation

The application will fail at startup or during operation if required variables are missing. Check server logs for specific errors.

## Best Practices

1. **Never commit `.env`** - Already in `.gitignore`
2. **Use different keys for dev/prod** - Separate Blockfrost and SDK credentials
3. **Rotate credentials regularly** - Especially if exposed
4. **Use secrets management in production** - Environment variables via hosting platform
5. **Never use NEXT_PUBLIC_ for secrets** - Only for truly public values
