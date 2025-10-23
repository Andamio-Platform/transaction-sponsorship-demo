import { NextRequest, NextResponse } from "next/server";
import { BlockfrostProvider } from "@meshsdk/core";
import { blockfrostApiKey } from "@/components/config";

export const dynamic = 'force-dynamic';

const blockfrost = new BlockfrostProvider(
  blockfrostApiKey
);

export async function POST(request: NextRequest) {
  try {
    const { signedTx } = await request.json();

    if (!signedTx) {
      return NextResponse.json(
        { success: false, error: "Signed transaction is required" },
        { status: 400 }
      );
    }

    const txHash = await blockfrost.submitTx(signedTx);

    return NextResponse.json({
      success: true,
      data: txHash,
    });
  } catch (error) {
    console.error("Failed to submit transaction:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
