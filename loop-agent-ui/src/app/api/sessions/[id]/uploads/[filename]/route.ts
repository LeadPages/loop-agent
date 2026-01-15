import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Get the workspaces path from environment or use default
function getWorkspacesPath(): string {
  return process.env.WORKSPACES_PATH || path.join(process.cwd(), "data/workspaces");
}

// Map file extensions to MIME types
const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".bmp": "image/bmp",
  ".ico": "image/x-icon",
};

// Validate that a filename is safe (no path traversal)
function isValidFilename(filename: string): boolean {
  // Must not be empty
  if (!filename || filename.trim() === "") {
    return false;
  }

  // Must not contain path separators or parent directory references
  if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
    return false;
  }

  // Must not start with a dot (hidden files)
  if (filename.startsWith(".")) {
    return false;
  }

  // Validate it's a simple filename with allowed characters
  // Allow alphanumeric, dash, underscore, and dots (for filenames like "file.name.ext")
  // Must have at least one dot and end with alphanumeric extension
  const validPattern = /^[a-zA-Z0-9_.-]+\.[a-zA-Z0-9]+$/;
  return validPattern.test(filename);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; filename: string }> }
) {
  try {
    const { id: sessionId, filename } = await params;

    // Validate filename to prevent path traversal attacks
    if (!isValidFilename(filename)) {
      return NextResponse.json(
        { error: "Invalid filename" },
        { status: 400 }
      );
    }

    // Construct the file path
    const workspacesPath = getWorkspacesPath();
    const uploadsDir = path.join(workspacesPath, sessionId, "uploads");
    const filePath = path.join(uploadsDir, filename);

    // Resolve to absolute path and verify it's within the uploads directory
    const resolvedPath = path.resolve(filePath);
    const resolvedUploadsDir = path.resolve(uploadsDir);

    if (!resolvedPath.startsWith(resolvedUploadsDir + path.sep)) {
      return NextResponse.json(
        { error: "Invalid file path" },
        { status: 400 }
      );
    }

    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Get file stats
    const stats = fs.statSync(resolvedPath);
    if (!stats.isFile()) {
      return NextResponse.json(
        { error: "Not a file" },
        { status: 400 }
      );
    }

    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    // Read the file
    const fileBuffer = fs.readFileSync(resolvedPath);

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": stats.size.toString(),
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to serve upload:", errorMessage);

    return NextResponse.json(
      { error: `Failed to serve file: ${errorMessage}` },
      { status: 500 }
    );
  }
}
