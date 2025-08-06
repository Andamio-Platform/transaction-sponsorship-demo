import { NextRequest, NextResponse } from "next/server";
import { BlockfrostProvider, MeshTxBuilder, TxParser } from "@meshsdk/core";
import { CSLSerializer } from "@meshsdk/core-csl";

export const dynamic = 'force-dynamic';

const blockfrost = new BlockfrostProvider(
  "preprod9nU4kQP5IaqnIFP9M8DhK8bfk1W6dufu"
);

export async function POST(request: NextRequest) {
  try {
    const { txCbor, sponsorAddress, utxos, collateralUtxos } = await request.json();

    if (!txCbor || !sponsorAddress || !utxos || !collateralUtxos) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const serializer = new CSLSerializer();
    const parser = new TxParser(serializer, blockfrost);
    const txParsed = await parser.parse(txCbor);

    console.log("inputs Original:", txParsed.inputs);

    // Filter out specific input if needed
    txParsed.inputs = txParsed.inputs.filter(input => 
      input.txIn.txHash !== "8222b0327a95e8c357016a5df64d93d7cf8a585a07c55327ae618a7e00d58d9e"
    );

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
      .txIn(utxos[0].input.txHash, utxos[0].input.outputIndex)
      .txIn(collateralUtxos[0].input.txHash, collateralUtxos[0].input.outputIndex)
      .txInCollateral(
        collateralUtxos[0].input.txHash,
        collateralUtxos[0].input.outputIndex
      )
      .complete();

    return NextResponse.json({
      success: true,
      data: unsignedTx,
    });
  } catch (error) {
    console.error("Failed to build sponsored transaction:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
