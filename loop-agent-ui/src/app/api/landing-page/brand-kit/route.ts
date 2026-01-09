import { NextRequest, NextResponse } from "next/server";
import { generateBrandKit } from "@/lib/landing-page";

export async function POST(request: NextRequest) {
  try {
    const { text, industryHint } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: "Missing text input" },
        { status: 400 }
      );
    }

    const result = await generateBrandKit(text, industryHint);

    return NextResponse.json(result);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Brand kit generation failed:", errorMessage);

    return NextResponse.json(
      { error: `Brand kit generation failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
