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

    // Get filename from query param, or find the latest landing page file
    const { searchParams } = new URL(request.url);
    let filename = searchParams.get("file");

    if (!filename) {
      // Find the most recent landing-page-*.html file
      const files = fs.readdirSync(workspacePath)
        .filter(f => f.startsWith("landing-page-") && f.endsWith(".html"))
        .sort()
        .reverse();

      if (files.length > 0) {
        filename = files[0];
      } else {
        // Fallback to legacy generated.html
        filename = "generated.html";
      }
    }

    // Sanitize filename to prevent path traversal
    const safeName = path.basename(filename);
    const htmlPath = path.join(workspacePath, safeName);

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
