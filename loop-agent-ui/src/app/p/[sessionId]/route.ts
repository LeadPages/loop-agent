import { NextRequest, NextResponse } from "next/server";
import { getWorkspacePath, listWorkspaceFiles } from "@/lib/workspace";
import fs from "fs";
import path from "path";

// GET /p/[sessionId] - Serve the generated HTML preview with a clean URL
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const workspacePath = getWorkspacePath(sessionId);

    // Check if workspace exists
    if (!fs.existsSync(workspacePath)) {
      return new NextResponse(
        `<!DOCTYPE html>
<html>
<head><title>Preview Not Found</title></head>
<body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #111; color: #fff;">
  <div style="text-align: center;">
    <h1>Preview Not Found</h1>
    <p>This session doesn't exist or has no generated content.</p>
  </div>
</body>
</html>`,
        {
          status: 404,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      );
    }

    // Find HTML files in the workspace
    const files = listWorkspaceFiles(sessionId);
    const htmlFile = files.find((f) => f.endsWith(".html"));

    if (!htmlFile) {
      return new NextResponse(
        `<!DOCTYPE html>
<html>
<head><title>No Preview Available</title></head>
<body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #111; color: #fff;">
  <div style="text-align: center;">
    <h1>No Preview Available</h1>
    <p>No HTML file has been generated for this session yet.</p>
  </div>
</body>
</html>`,
        {
          status: 404,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      );
    }

    // Read and serve the HTML file
    const htmlPath = path.join(workspacePath, htmlFile);
    const html = fs.readFileSync(htmlPath, "utf-8");

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Preview route error:", errorMessage);

    return new NextResponse(
      `<!DOCTYPE html>
<html>
<head><title>Error</title></head>
<body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #111; color: #fff;">
  <div style="text-align: center;">
    <h1>Error Loading Preview</h1>
    <p>${errorMessage}</p>
  </div>
</body>
</html>`,
      {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }
}
