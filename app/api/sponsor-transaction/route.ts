import { NextRequest, NextResponse } from "next/server";
import { Web3Sdk } from "@utxos/web3-sdk";
import { BlockfrostProvider, MeshTxBuilder, TxParser } from "@meshsdk/core";
import { CSLSerializer } from "@meshsdk/core-csl";

export const dynamic = 'force-dynamic';

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
    const { txCbor, tx } = await request.json();

    if (!txCbor) {
      return NextResponse.json(
        { success: false, error: "Transaction data is required" },
        { status: 400 }
      );
    }
    const wallets = await sdk.wallet.getWallets();
    const wallet = (await sdk.wallet.getWallet(wallets[0].id, 0)).wallet;
    const address = await wallet.getChangeAddress();
    const collateralUtxos = await wallet.getCollateral();
    const utxos = (await wallet.getUtxos()).filter(
      (utxo) =>
        !collateralUtxos.some(
          (c) =>
            c.input.txHash === utxo.input.txHash &&
            c.input.outputIndex === utxo.input.outputIndex
        )
    );

    console.log("Collateral UTXOs:", collateralUtxos);
    console.log("UTXOs available for sponsorship:", utxos);

    const serializer = new CSLSerializer();

    const parser = new TxParser(serializer, blockfrost);

    const txParsed = await parser.parse(txCbor);

    txParsed.inputs = [];
    txParsed.changeAddress = address;
    txParsed.fee = "0";
    txParsed.collateralReturnAddress = address;
    txParsed.collaterals = [];

    const txBuilder = new MeshTxBuilder({
      serializer,
      fetcher: blockfrost,
      evaluator: blockfrost,
    });
    txBuilder.meshTxBuilderBody = txParsed;

    const unsignedTx = await txBuilder
      .txIn(utxos[0].input.txHash, utxos[0].input.outputIndex)
      .txIn(collateralUtxos[0].input.txHash, collateralUtxos[0].input.outputIndex)
      .txInCollateral(
        collateralUtxos[0].input.txHash,
        collateralUtxos[0].input.outputIndex
      )
      .complete();

    const signedTx = await wallet.signTx(unsignedTx);

    return NextResponse.json({
      success: true,
      data: signedTx,
    });
  } catch (error) {
    console.error("Failed to sponsor transaction:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
