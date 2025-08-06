import { NextRequest, NextResponse } from "next/server";
import { Web3Sdk } from "@utxos/web3-sdk";
import { BlockfrostProvider } from "@meshsdk/core";

const blockfrost = new BlockfrostProvider(
  "https://blockfrost1fnqnszsgxy7f6xm0e9a.blockfrost-m1.demeter.run"
);

const sdk = new Web3Sdk({
  projectId: "34f25f89-7cf6-4abb-8660-df55f0842b8f",
  apiKey: "f7684db5-4e91-4f1d-ac62-82da3e31d7ec",
  network: "testnet",
  privateKey:
    "MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgUkkPjAn0eGhQCj8pn5W8kd4urBZ2anNqf3m19f6EtnOhRANCAARCw8EK/uUauXhiaTu6/H2w/pJzbRwJtiIxbSpthW+RGi8xILrP4C5/LcuZLpfmMJF/axQ39t4vguf0zS2LFyMf",
  fetcher: blockfrost,
  submitter: blockfrost,
});

export async function POST(request: NextRequest) {
  try {
    const { unsignedTx } = await request.json();

    if (!unsignedTx) {
      return NextResponse.json(
        { success: false, error: "Unsigned transaction is required" },
        { status: 400 }
      );
    }

    const wallets = await sdk.wallet.getWallets();
    const sponsorWallet = (await sdk.wallet.getWallet(wallets[0].id, 0)).wallet;
    
    const signedTx = await sponsorWallet.signTx(unsignedTx, true);

    return NextResponse.json({
      success: true,
      data: signedTx,
    });
  } catch (error) {
    console.error("Failed to sign transaction:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
