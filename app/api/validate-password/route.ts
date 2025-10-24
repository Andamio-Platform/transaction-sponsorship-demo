import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { success: false, error: "Password is required" },
        { status: 400 }
      );
    }

    const requiredPassword = process.env.REQUIRED_PASSWORD;

    if (!requiredPassword) {
      console.error("REQUIRED_PASSWORD not set in environment variables");
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    const isValid = password === requiredPassword;

    return NextResponse.json({
      success: true,
      data: { valid: isValid },
    });
  } catch (error) {
    console.error("Password validation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
