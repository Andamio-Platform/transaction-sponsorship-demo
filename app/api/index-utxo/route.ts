import { andamioApi } from "@/components/config";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const alias = searchParams.get("alias");
    
    if (!alias) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing 'alias' query parameter",
        },
        { status: 400 }
      );
    }

    const indexUtxobf = await fetch(andamioApi + "/index-validator/utxos?new_alias=" + alias);
    
    if (!indexUtxobf.ok) {
      throw new Error(`API request failed with status ${indexUtxobf.status}`);
    }
    
    const indexUtxotxOutRef = await indexUtxobf.json();

    return NextResponse.json({
      success: true,
      data: {
        indexUtxotxOutRef,
      },
    });
  } catch (error) {
    console.error("Failed to get UTXOs:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}