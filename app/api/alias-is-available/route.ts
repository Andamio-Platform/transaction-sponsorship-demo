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

    const check = await fetch(andamioApi + "/index-validator/alias-availability?alias=" + alias);

    if (!check.ok) {
      throw new Error(`API request failed with status ${check.status}`);
    }

    const checkStatus = await check.json();

    return NextResponse.json({
      success: true,
      data: {
        checkStatus,
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