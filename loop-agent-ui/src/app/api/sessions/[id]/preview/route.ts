import { NextRequest, NextResponse } from "next/server";
import { getWorkspacePath } from "@/lib/workspace";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workspacePath = getWorkspacePath(id);
    const htmlPath = path.join(workspacePath, "generated.html");

    if (!fs.existsSync(htmlPath)) {
      return NextResponse.json(
        { error: "No generated page found" },
        { status: 404 }
      );
    }

    const html = fs.readFileSync(htmlPath, "utf-8");

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Preview failed:", errorMessage);

    return NextResponse.json(
      { error: `Preview failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
