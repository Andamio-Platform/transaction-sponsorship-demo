import { NextRequest, NextResponse } from "next/server";
import { BlockfrostProvider, MeshTxBuilder, TxParser } from "@meshsdk/core";
import { CSLSerializer } from "@meshsdk/core-csl";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { builtTx, sponsorAddress, collateralUtxos, utxos, universalStaticUtxo } =
      await request.json();

    if (!builtTx || !sponsorAddress || !collateralUtxos || !utxos) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const blockfrostApiKey = process.env.BLOCKFROST_API_KEY;

    if (!blockfrostApiKey) {
      console.error("BLOCKFROST_API_KEY not set in environment variables");
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    const blockfrost = new BlockfrostProvider(blockfrostApiKey);

    const serializer = new CSLSerializer();
    const parser = new TxParser(serializer, blockfrost);

    const txParsed = await parser.parse(builtTx);

    console.log("inputs Original:", txParsed.inputs);

    // Filter out specific input if needed
    if (universalStaticUtxo) {
      txParsed.inputs = txParsed.inputs.filter(
        (input) => input.txIn.txHash !== universalStaticUtxo.input.txHash
      );
      txParsed.outputs = txParsed.outputs.filter(
        (output) => output.address !== universalStaticUtxo.output.address
      );
    }

    console.log("inputs Filtered:", txParsed.inputs);

    txParsed.changeAddress = sponsorAddress;
    txParsed.fee = "0";
    txParsed.collateralReturnAddress = sponsorAddress;
    txParsed.collaterals = [];

    const txBuilder = new MeshTxBuilder({
      serializer,
      fetcher: blockfrost,
      evaluator: blockfrost,
    });
    txBuilder.meshTxBuilderBody = txParsed;

    const unsignedTx = await txBuilder
      .selectUtxosFrom(utxos)
      .txInCollateral(
        collateralUtxos[0].input.txHash,
        collateralUtxos[0].input.outputIndex
      )
      .txOut(sponsorAddress, [
        {
          unit: "lovelace",
          quantity: "5000000",
        },
      ])
      .complete();

    console.log("Transaction parsed and modified for sponsorship");

    return NextResponse.json({
      success: true,
      data: { unsignedTx },
    });
  } catch (error) {
    console.error("Parse transaction error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
