"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Attachment } from "./image-upload";

interface ImagePreviewProps {
  attachments: Attachment[];
  onRemove?: (id: string) => void;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImagePreview({
  attachments,
  onRemove,
}: ImagePreviewProps) {
  const [modalImage, setModalImage] = useState<Attachment | null>(null);
  const [expandedAnalysis, setExpandedAnalysis] = useState<string | null>(null);

  if (attachments.length === 0) return null;

  const getImageUrl = (attachment: Attachment) => {
    // Use the URL from the attachment (set by the server)
    return attachment.url;
  };

  // Check if any attachment has analysis
  const hasAnyAnalysis = attachments.some((a) => a.analysis);

  return (
    <>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="group relative rounded-lg border border-border bg-muted/50 p-1"
            >
              <button
                type="button"
                onClick={() => setModalImage(attachment)}
                className="block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md"
              >
                <img
                  src={getImageUrl(attachment)}
                  alt={attachment.filename}
                  className="h-16 w-16 rounded-md object-cover"
                />
              </button>
              {/* Analysis indicator */}
              {attachment.analysis && (
                <button
                  type="button"
                  onClick={() => setExpandedAnalysis(
                    expandedAnalysis === attachment.id ? null : attachment.id
                  )}
                  className={cn(
                    "absolute -left-1 -bottom-1 rounded-full p-1",
                    "bg-primary text-primary-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-ring",
                    expandedAnalysis === attachment.id && "bg-primary/80"
                  )}
                  title="View image analysis"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              )}
              {onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(attachment.id)}
                  className={cn(
                    "absolute -right-2 -top-2 rounded-full bg-destructive p-1",
                    "text-white opacity-0 transition-opacity",
                    "group-hover:opacity-100 focus:opacity-100",
                    "focus:outline-none focus:ring-2 focus:ring-ring"
                  )}
                  title="Remove"
                >
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
              <div className="mt-1 max-w-16 truncate text-center text-xs text-muted-foreground">
                <div className="truncate" title={attachment.filename}>
                  {attachment.filename}
                </div>
                {attachment.sizeBytes && (
                  <div className="text-xs opacity-70">
                    {formatFileSize(attachment.sizeBytes)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Expanded analysis panel */}
        {expandedAnalysis && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-primary">Image Analysis</span>
              <button
                type="button"
                onClick={() => setExpandedAnalysis(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="whitespace-pre-wrap text-muted-foreground">
              {attachments.find((a) => a.id === expandedAnalysis)?.analysis}
            </div>
          </div>
        )}

        {/* Summary indicator when analysis exists */}
        {hasAnyAnalysis && !expandedAnalysis && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <svg className="h-3 w-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Image{attachments.filter((a) => a.analysis).length > 1 ? 's' : ''} analyzed - click info icon to view details
          </div>
        )}
      </div>

      {/* Full-size modal */}
      {modalImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setModalImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <button
              type="button"
              onClick={() => setModalImage(null)}
              className="absolute -right-4 -top-4 rounded-full bg-background p-2 shadow-lg hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <img
              src={getImageUrl(modalImage)}
              alt={modalImage.filename}
              className="max-h-[85vh] max-w-[85vw] rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="mt-2 text-center text-sm text-white">
              {modalImage.filename}
              {modalImage.sizeBytes && (
                <span className="ml-2 opacity-70">
                  ({formatFileSize(modalImage.sizeBytes)})
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Component for displaying attachments in message bubbles (read-only)
export function MessageAttachments({
  attachments,
}: {
  attachments: Attachment[];
}) {
  const [modalImage, setModalImage] = useState<Attachment | null>(null);

  if (attachments.length === 0) return null;

  const getImageUrl = (attachment: Attachment) => {
    return attachment.url;
  };

  return (
    <>
      <div className="mt-2 flex flex-wrap gap-2">
        {attachments.map((attachment) => (
          <button
            key={attachment.id}
            type="button"
            onClick={() => setModalImage(attachment)}
            className="block rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <img
              src={getImageUrl(attachment)}
              alt={attachment.filename}
              className="h-24 w-24 rounded-md object-cover border border-border/50"
            />
          </button>
        ))}
      </div>

      {/* Full-size modal */}
      {modalImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setModalImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <button
              type="button"
              onClick={() => setModalImage(null)}
              className="absolute -right-4 -top-4 rounded-full bg-background p-2 shadow-lg hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <img
              src={getImageUrl(modalImage)}
              alt={modalImage.filename}
              className="max-h-[85vh] max-w-[85vw] rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="mt-2 text-center text-sm text-white">
              {modalImage.filename}
              {modalImage.sizeBytes && (
                <span className="ml-2 opacity-70">
                  ({formatFileSize(modalImage.sizeBytes)})
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
