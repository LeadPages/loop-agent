import { NextRequest, NextResponse } from "next/server";
import { generateLandingPage, type BrandKit } from "@/lib/landing-page";

export async function POST(request: NextRequest) {
  try {
    const { brandKit, requirements } = await request.json();

    if (!brandKit || !requirements) {
      return NextResponse.json(
        { error: "Missing brandKit or requirements" },
        { status: 400 }
      );
    }

    const result = await generateLandingPage(brandKit as BrandKit, requirements);

    return NextResponse.json(result);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Landing page generation failed:", errorMessage);

    return NextResponse.json(
      { error: `Generation failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
