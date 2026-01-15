import { NextRequest, NextResponse } from "next/server";
import { createAttachment, getSession, updateAttachmentAnalysis } from "@/lib/db";
import { analyzeImage, isApiKeyConfigured } from "@/lib/landing-page/image-analyzer";
import { analyzeImage as analyzeImageSdk } from "@/lib/landing-page/sdk-client";
import { getWorkspacePath } from "@/lib/workspace";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";

// Configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file (Claude API limit)
const MAX_FILES_PER_REQUEST = 5;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

// Magic bytes signatures for image validation
const MAGIC_BYTES: Record<string, { bytes: number[]; offset?: number }[]> = {
  "image/jpeg": [{ bytes: [0xff, 0xd8, 0xff] }],
  "image/png": [{ bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  "image/gif": [
    { bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] }, // GIF87a
    { bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] }, // GIF89a
  ],
  "image/webp": [
    { bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // RIFF
    { bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 }, // WEBP
  ],
};

/**
 * Validate file content by checking magic bytes
 */
function validateMagicBytes(
  buffer: ArrayBuffer,
  declaredMimeType: string
): boolean {
  const uint8Array = new Uint8Array(buffer);
  const signatures = MAGIC_BYTES[declaredMimeType];

  if (!signatures) {
    return false;
  }

  // For WebP, we need to check both RIFF header and WEBP marker
  if (declaredMimeType === "image/webp") {
    const riffCheck = signatures[0];
    const webpCheck = signatures[1];

    const riffMatches = riffCheck.bytes.every(
      (byte, index) => uint8Array[(riffCheck.offset ?? 0) + index] === byte
    );
    const webpMatches = webpCheck.bytes.every(
      (byte, index) => uint8Array[(webpCheck.offset ?? 0) + index] === byte
    );

    return riffMatches && webpMatches;
  }

  // For other formats, check if any signature matches
  return signatures.some((sig) =>
    sig.bytes.every(
      (byte, index) => uint8Array[(sig.offset ?? 0) + index] === byte
    )
  );
}

/**
 * Detect MIME type from magic bytes
 */
function detectMimeType(buffer: ArrayBuffer): string | null {
  for (const [mimeType] of Object.entries(MAGIC_BYTES)) {
    if (validateMagicBytes(buffer, mimeType)) {
      return mimeType;
    }
  }
  return null;
}

/**
 * Sanitize filename to prevent path traversal and other attacks
 */
function sanitizeFilename(filename: string): string {
  // Remove path components
  let sanitized = path.basename(filename);

  // Remove any null bytes
  sanitized = sanitized.replace(/\0/g, "");

  // Remove leading dots (prevents hidden files and path traversal)
  sanitized = sanitized.replace(/^\.+/, "");

  // Replace potentially dangerous characters and spaces
  // Keep only alphanumeric, dash, underscore, and dot
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, "_");

  // Collapse multiple underscores
  sanitized = sanitized.replace(/_+/g, "_");

  // Limit length (preserve extension)
  const ext = path.extname(sanitized);
  const name = path.basename(sanitized, ext);
  const maxNameLength = 200 - ext.length;

  if (name.length > maxNameLength) {
    sanitized = name.substring(0, maxNameLength) + ext;
  }

  // If nothing left, use a default name
  if (!sanitized || sanitized === ext) {
    sanitized = "unnamed" + ext;
  }

  return sanitized;
}

/**
 * Get the extension for a given MIME type
 */
function getExtensionForMimeType(mimeType: string): string {
  const extensions: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
  };
  return extensions[mimeType] || "";
}

/**
 * Get workspace uploads directory path
 */
function getUploadsPath(sessionId: string): string {
  return path.join(getWorkspacePath(sessionId), "uploads");
}

// POST /api/sessions/:id/upload - Upload files for a session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;

  // Validate session exists
  const session = getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("files");

    // Validate we have files
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    // Validate file count
    if (files.length > MAX_FILES_PER_REQUEST) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES_PER_REQUEST} files per request allowed` },
        { status: 400 }
      );
    }

    // Ensure uploads directory exists
    const uploadsDir = getUploadsPath(sessionId);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const attachments: Array<{
      id: string;
      filename: string;
      storedPath: string;
      mimeType: string;
      sizeBytes: number;
      url: string;
      analysis: string | null;
    }> = [];

    for (const file of files) {
      // Ensure it's actually a File object
      if (!(file instanceof File)) {
        return NextResponse.json(
          { error: "Invalid file format" },
          { status: 400 }
        );
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            error: `File "${file.name}" exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          },
          { status: 400 }
        );
      }

      // Validate declared MIME type
      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        return NextResponse.json(
          {
            error: `File "${file.name}" has unsupported type "${file.type}". Allowed types: ${Array.from(ALLOWED_MIME_TYPES).join(", ")}`,
          },
          { status: 400 }
        );
      }

      // Read file buffer for magic bytes validation
      const buffer = await file.arrayBuffer();

      // Validate magic bytes match declared MIME type
      const detectedMimeType = detectMimeType(buffer);
      if (!detectedMimeType) {
        return NextResponse.json(
          {
            error: `File "${file.name}" does not appear to be a valid image file`,
          },
          { status: 400 }
        );
      }

      // Verify detected type matches declared type (or is compatible)
      if (detectedMimeType !== file.type) {
        return NextResponse.json(
          {
            error: `File "${file.name}" content does not match declared type. Detected: ${detectedMimeType}, declared: ${file.type}`,
          },
          { status: 400 }
        );
      }

      // Generate unique ID and sanitize filename
      const attachmentId = randomUUID();
      const sanitizedFilename = sanitizeFilename(file.name);

      // Ensure correct extension based on actual content
      const correctExt = getExtensionForMimeType(detectedMimeType);
      const baseName = path.basename(
        sanitizedFilename,
        path.extname(sanitizedFilename)
      );
      const finalFilename = `${attachmentId}-${baseName}${correctExt}`;

      // Write file to disk
      const storedPath = path.join(uploadsDir, finalFilename);
      fs.writeFileSync(storedPath, Buffer.from(buffer));

      // Create database record - store the final filename as stored_path (relative)
      const attachment = createAttachment(
        attachmentId,
        sessionId,
        sanitizedFilename, // Store original sanitized filename
        finalFilename, // Store just the filename, not full path
        detectedMimeType,
        file.size
      );

      // Generate URL for accessing the file using the stored filename
      const url = `/api/sessions/${sessionId}/uploads/${finalFilename}`;

      // Analyze the image with Claude to extract context
      // Uses direct Claude API (Haiku 4.5) for speed, falls back to Agent SDK if API key not set
      let analysis: string | null = null;
      try {
        console.log(`[upload] Analyzing image: ${finalFilename}`);
        if (isApiKeyConfigured()) {
          // Fast path: Direct Claude API with Haiku 4.5
          console.log(`[upload] Using direct Claude API (Haiku 4.5)`);
          analysis = await analyzeImage(storedPath, detectedMimeType);
        } else {
          // Fallback: Agent SDK (slower, uses Sonnet)
          console.log(`[upload] Using Agent SDK (no ANTHROPIC_API_KEY set)`);
          analysis = await analyzeImageSdk(storedPath, detectedMimeType);
        }
        // Store analysis in database
        updateAttachmentAnalysis(attachmentId, analysis);
        console.log(`[upload] Image analysis complete for: ${finalFilename}`);
      } catch (analysisError) {
        console.error(`[upload] Failed to analyze image ${finalFilename}:`, analysisError);
        // Continue without analysis - it's not critical
      }

      attachments.push({
        id: attachment.id,
        filename: attachment.filename,
        storedPath: attachment.stored_path,
        mimeType: attachment.mime_type,
        sizeBytes: attachment.size_bytes,
        url,
        analysis,
      });
    }

    return NextResponse.json({ attachments }, { status: 201 });
  } catch (error) {
    console.error("Failed to upload files:", error);
    return NextResponse.json(
      { error: "Failed to upload files" },
      { status: 500 }
    );
  }
}
