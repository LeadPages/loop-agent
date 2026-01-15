# Image Upload Feature Plan

## Overview

Add the ability for users to attach images to chat messages. Images will be stored persistently with session data and passed to the agent for analysis to help determine colors, products, business type, and other visual context for landing page generation.

## Current Architecture

```
/loop-data/                          # Railway volume mount (persistent)
├── sessions.db                      # SQLite database
└── workspaces/
    └── {sessionId}/
        └── landing-page-*.html      # Generated pages
```

**Database Schema (current):**
- `sessions` - Session metadata
- `messages` - Chat messages (id, session_id, type, content, tool_name)

**Key Files:**
- `src/components/dashboard/chat.tsx` - Chat UI component
- `src/app/api/sessions/[id]/message/route.ts` - Message API (POST with JSON body)
- `src/lib/agent-runner.ts` - Runs agent and streams responses
- `src/lib/landing-page/brand-kit-generator.ts` - Extracts brand info from text
- `src/lib/db.ts` - Database operations

## Implementation Plan

### Phase 1: Storage & Database

**1.1 Create uploads directory structure**
```
/loop-data/workspaces/{sessionId}/uploads/
└── {uuid}-{original-filename}.{ext}
```

**1.2 Add attachments table to database (db.ts)**
```sql
CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY,
  message_id TEXT,              -- NULL until message is sent
  session_id TEXT NOT NULL,
  filename TEXT NOT NULL,       -- Original filename
  stored_path TEXT NOT NULL,    -- Path relative to workspace
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE SET NULL
);
```

**1.3 Add database functions**
- `createAttachment(sessionId, filename, storedPath, mimeType, sizeBytes)`
- `linkAttachmentToMessage(attachmentId, messageId)`
- `getAttachmentsBySession(sessionId)`
- `getAttachmentsByMessage(messageId)`
- `deleteAttachment(id)`

### Phase 2: API Endpoints

**2.1 New upload endpoint: `POST /api/sessions/[id]/upload`**
```typescript
// Accept multipart/form-data
// Save files to /loop-data/workspaces/{sessionId}/uploads/
// Return attachment metadata

Request: FormData with 'files' field (multiple files)
Response: {
  attachments: [
    { id, filename, storedPath, mimeType, sizeBytes, url }
  ]
}
```

**2.2 New attachment serving endpoint: `GET /api/sessions/[id]/uploads/[filename]`**
```typescript
// Serve uploaded images for preview
// Validate filename is in session's uploads directory
// Return image with appropriate Content-Type
```

**2.3 Modify message endpoint to accept attachments**
```typescript
// POST /api/sessions/[id]/message
// Add optional attachmentIds array to link attachments to message
Request: {
  message: string,
  model?: string,
  attachmentIds?: string[]  // NEW: IDs of uploaded attachments to include
}
```

### Phase 3: Frontend Components

**3.1 Update Message interface (chat.tsx)**
```typescript
interface Message {
  id: string;
  type: "user" | "assistant" | "tool" | "system";
  content: string;
  toolName?: string;
  timestamp: Date;
  attachments?: Attachment[];  // NEW
}

interface Attachment {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
}
```

**3.2 Add ImageUploadButton component**
```typescript
// Click to open file picker
// Accept: image/jpeg, image/png, image/webp, image/gif
// Max file size: 10MB per file
// Max files: 5 per message
// Show upload progress
// Return array of uploaded attachment IDs
```

**3.3 Add ImagePreview component**
```typescript
// Grid display of attached images (thumbnails)
// Click to view full size in modal
// X button to remove before sending
// Show filename and size
```

**3.4 Update Chat component**
```typescript
// Add state for pending attachments (uploaded but not sent)
const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);

// Modify input area layout:
// [Image Upload Button] [Text Input] [Send Button]
//    [Image Preview Grid - if attachments exist]

// On send: include attachment IDs in message
// Clear pending attachments after send
```

**3.5 Update MessageBubble component**
```typescript
// If message has attachments, render image gallery above/below text
// Thumbnail grid for multiple images
// Click to expand
```

### Phase 4: Agent Integration

**4.1 Pass images to brand kit generator**

Modify `generateBrandKit()` in `brand-kit-generator.ts`:
```typescript
export async function generateBrandKit(
  prompt: string,
  images?: { path: string; mimeType: string }[]  // NEW
): Promise<BrandKitResult>
```

**4.2 Update runLandingPageGenerator**

In `agent-runner.ts`:
```typescript
async function* runLandingPageGenerator(
  sessionId: string,
  prompt: string,
  model?: string,
  attachments?: Attachment[]  // NEW
)
```

**4.3 Image analysis prompt additions**

When images are provided, add to brand kit generation prompt:
```
## Attached Images

The user has provided the following images. Analyze them for:
- **Color palette**: Dominant colors, accent colors, color harmony
- **Product/Service**: What is being shown or offered
- **Style**: Modern, vintage, minimalist, bold, playful, professional
- **Industry signals**: What industry does this appear to be
- **Brand personality**: What feeling does the imagery convey
- **Target audience**: Who appears to be the intended audience

Use these visual insights to inform the brand kit generation.
```

**4.4 Claude multimodal API integration**

Since Claude is multimodal, images can be passed directly:
```typescript
// In brand-kit-generator.ts
const content: ContentBlock[] = [
  { type: "text", text: prompt },
  ...images.map(img => ({
    type: "image",
    source: {
      type: "base64",
      media_type: img.mimeType,
      data: fs.readFileSync(img.path).toString('base64')
    }
  }))
];
```

### Phase 5: UI/UX Enhancements

**5.1 Drag and drop support**
- Allow dragging images directly into chat area
- Visual drop zone indicator

**5.2 Paste from clipboard**
- Support Ctrl+V / Cmd+V to paste images from clipboard

**5.3 Loading states**
- Show upload progress bar
- Disable send while uploading
- Show "analyzing images..." during agent processing

**5.4 Error handling**
- File too large (>10MB)
- Invalid file type
- Upload failed
- Too many files (>5)

## File Changes Summary

### New Files
- `src/app/api/sessions/[id]/upload/route.ts` - Upload endpoint
- `src/app/api/sessions/[id]/uploads/[filename]/route.ts` - Serve uploads
- `src/components/dashboard/image-upload.tsx` - Upload button component
- `src/components/dashboard/image-preview.tsx` - Preview grid component
- `src/lib/attachments.ts` - Attachment utilities

### Modified Files
- `src/lib/db.ts` - Add attachments table and functions
- `src/components/dashboard/chat.tsx` - Add upload UI
- `src/app/api/sessions/[id]/message/route.ts` - Accept attachment IDs
- `src/app/api/sessions/[id]/route.ts` - Include attachments in response
- `src/lib/agent-runner.ts` - Pass attachments to generator
- `src/lib/landing-page/brand-kit-generator.ts` - Accept images for analysis
- `src/app/page.tsx` - Update Message type, handle attachments

## Implementation Order

1. **Database & Storage** (Phase 1)
   - Add attachments table
   - Add database functions
   - Create uploads directory on session creation

2. **Upload API** (Phase 2.1, 2.2)
   - Create upload endpoint
   - Create serving endpoint
   - Test with curl/Postman

3. **Basic UI** (Phase 3.2, 3.3, 3.4 partial)
   - Add upload button
   - Add preview grid
   - Wire up to upload API

4. **Message Integration** (Phase 2.3, Phase 3.4, 3.5)
   - Link attachments to messages
   - Display attachments in message history
   - Load attachments on session restore

5. **Agent Integration** (Phase 4)
   - Pass images to brand kit generator
   - Add image analysis prompts
   - Test end-to-end

6. **Polish** (Phase 5)
   - Drag and drop
   - Paste support
   - Error handling
   - Loading states

## Technical Considerations

### File Size Limits
- **Per file**: 10MB max (Claude's image limit is ~20MB but we'll be conservative)
- **Per message**: 5 images max
- **Supported formats**: JPEG, PNG, WebP, GIF

### Security
- Validate file type by magic bytes, not just extension
- Sanitize filenames (remove path traversal attempts)
- Store with UUID prefix to prevent collisions
- Serve with Content-Disposition: inline

### Performance
- Compress large images on upload (optional)
- Generate thumbnails for preview (optional, defer to Phase 2)
- Lazy load images in message history

### Cleanup
- Delete orphaned attachments (uploaded but never sent) after 24 hours
- Delete uploads when session is deleted (handled by workspace deletion)

## Testing Checklist

- [ ] Upload single image
- [ ] Upload multiple images
- [ ] Upload with text message
- [ ] Upload without text (image only)
- [ ] View uploaded images in message history
- [ ] Restore session with images
- [ ] Delete attachment before sending
- [ ] File size limit enforcement
- [ ] Invalid file type rejection
- [ ] Image analysis in brand kit generation
- [ ] Generated landing page reflects image colors
- [ ] Drag and drop upload
- [ ] Paste from clipboard
