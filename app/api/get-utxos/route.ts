import { NextResponse } from "next/server";
import { Web3Sdk } from "@utxos/web3-sdk";
import { BlockfrostProvider } from "@meshsdk/core";
import { blockfrostApiKey, web3SdkConfig } from "@/components/config";

export const dynamic = 'force-dynamic';

const blockfrost = new BlockfrostProvider(blockfrostApiKey);

const sdk = new Web3Sdk({
  ...web3SdkConfig,
  fetcher: blockfrost,
  submitter: blockfrost,
});

export async function GET() {
  try {
    const wallets = await sdk.wallet.getWallets();
    const sponsorWallet = (await sdk.wallet.getWallet(wallets[0].id, 0)).wallet;
    const sponsorAddress = await sponsorWallet.getChangeAddress();
    const collateralUtxos = await sponsorWallet.getCollateral();
    const allUtxos = await sponsorWallet.getUtxos();
    
    const utxos = allUtxos.filter(
      (utxo) =>
        !collateralUtxos.some(
          (c) =>
            c.input.txHash === utxo.input.txHash &&
            c.input.outputIndex === utxo.input.outputIndex
        )
    );

    const response = NextResponse.json({
      success: true,
      data: {
        sponsorAddress,
        collateralUtxos,
        utxos,
      },
    });

    // Prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error("Failed to get UTXOs:", error);
    const errorResponse = NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );

    // Prevent caching for error responses too
    errorResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    errorResponse.headers.set('Pragma', 'no-cache');
    errorResponse.headers.set('Expires', '0');

    return errorResponse;
  }
}
