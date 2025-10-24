// Client-side configuration (safe to expose to browser)
export const blockfrostApiKey = process.env.NEXT_PUBLIC_BLOCKFROST_API_KEY!;
export const andamioApi = process.env.NEXT_PUBLIC_ANDAMIO_API!;
export const extraSponsorshipLovelace = process.env.NEXT_PUBLIC_EXTRA_SPONSORSHIP_LOVELACE!;
export const REQUIRED_PASSWORD = process.env.NEXT_PUBLIC_REQUIRED_PASSWORD!;

// Server-side only configuration (do not use in client components)
export const web3SdkConfig = {
  projectId: process.env.WEB3_SDK_PROJECT_ID!,
  apiKey: process.env.WEB3_SDK_API_KEY!,
  network: process.env.WEB3_SDK_NETWORK as "testnet" | "mainnet",
  privateKey: process.env.WEB3_SDK_PRIVATE_KEY!,
};