"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  sizeBytes?: number;
  analysis?: string | null;
  isAnalyzing?: boolean; // True while upload/analysis is in progress
}

interface ImageUploadButtonProps {
  onUpload: (attachments: Attachment[]) => void;
  onAnalysisStart?: (tempAttachments: Attachment[]) => void; // Called immediately with temp attachments
  onAnalysisComplete?: (tempId: string, finalAttachment: Attachment) => void; // Called when analysis finishes
  disabled?: boolean;
  sessionId: string;
}

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (Claude API limit)
export const MAX_FILES = 5;

// Shared validation function
export function validateFiles(files: File[]): { valid: File[]; error: string | null } {
  if (files.length > MAX_FILES) {
    return { valid: [], error: `Maximum ${MAX_FILES} files allowed per selection` };
  }

  const validFiles: File[] = [];
  for (const file of files) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return { valid: [], error: `Invalid file type: ${file.name}. Accepted: JPEG, PNG, WebP, GIF` };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { valid: [], error: `File too large: ${file.name}. Maximum size is 5MB` };
    }
    validFiles.push(file);
  }

  return { valid: validFiles, error: null };
}

// Shared upload function
export async function uploadFiles(
  sessionId: string,
  files: File[]
): Promise<{ attachments: Attachment[]; error: string | null }> {
  const { valid, error } = validateFiles(files);
  if (error) {
    return { attachments: [], error };
  }

  try {
    const formData = new FormData();
    valid.forEach((file) => {
      formData.append("files", file);
    });

    const response = await fetch(`/api/sessions/${sessionId}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Upload failed");
    }

    const data = await response.json();
    return { attachments: data.attachments, error: null };
  } catch (err) {
    return { attachments: [], error: err instanceof Error ? err.message : "Upload failed" };
  }
}

export function ImageUploadButton({
  onUpload,
  onAnalysisStart,
  onAnalysisComplete,
  disabled = false,
  sessionId,
}: ImageUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);

    // Validate files first
    const { valid, error: validationError } = validateFiles(Array.from(files));
    if (validationError) {
      setError(validationError);
      return;
    }

    // Create temporary attachments with local preview URLs immediately
    const tempAttachments: Attachment[] = valid.map((file, index) => ({
      id: `temp-${Date.now()}-${index}`,
      filename: file.name,
      url: URL.createObjectURL(file), // Local blob URL for immediate preview
      mimeType: file.type,
      sizeBytes: file.size,
      isAnalyzing: true,
    }));

    // Notify parent to show images immediately with analyzing state
    if (onAnalysisStart) {
      onAnalysisStart(tempAttachments);
    }

    setIsUploading(true);

    // Upload and analyze
    const { attachments, error: uploadError } = await uploadFiles(sessionId, valid);

    if (uploadError) {
      setError(uploadError);
      // Remove temp attachments on error
      if (onAnalysisStart) {
        // Parent should handle cleanup
      }
    } else {
      // Update each temp attachment with the final server response
      if (onAnalysisComplete) {
        attachments.forEach((attachment, index) => {
          const tempId = tempAttachments[index]?.id;
          if (tempId) {
            onAnalysisComplete(tempId, { ...attachment, isAnalyzing: false });
          }
        });
      } else {
        // Fallback to simple onUpload if new callbacks not provided
        onUpload(attachments.map(a => ({ ...a, isAnalyzing: false })));
      }
    }

    setIsUploading(false);
    // Reset input so same file can be selected again
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        multiple
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleClick}
        disabled={disabled || isUploading}
        className={cn(isUploading && "animate-pulse")}
        title="Attach images"
      >
        {isUploading ? (
          <svg
            className="h-4 w-4 animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        )}
      </Button>
      {error && (
        <div className="absolute bottom-full left-0 mb-2 whitespace-nowrap rounded-md bg-destructive px-2 py-1 text-xs text-white">
          {error}
        </div>
      )}
    </div>
  );
}
