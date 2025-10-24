// Client-side configuration (safe to expose to browser)
export const andamioApi = process.env.NEXT_PUBLIC_ANDAMIO_API!;

// Server-side only configuration (do not use in client components)
export const web3SdkConfig = {
  projectId: process.env.WEB3_SDK_PROJECT_ID!,
  apiKey: process.env.WEB3_SDK_API_KEY!,
  network: process.env.WEB3_SDK_NETWORK as "testnet" | "mainnet",
  privateKey: process.env.WEB3_SDK_PRIVATE_KEY!,
};