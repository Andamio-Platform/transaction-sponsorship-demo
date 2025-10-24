import { NextRequest, NextResponse } from "next/server";
import { Web3Sdk } from "@utxos/web3-sdk";
import { BlockfrostProvider } from "@meshsdk/core";
import { web3SdkConfig } from "@/components/config";

export const dynamic = 'force-dynamic';

const blockfrost = new BlockfrostProvider(process.env.BLOCKFROST_API_KEY!);

const sdk = new Web3Sdk({
  ...web3SdkConfig,
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
