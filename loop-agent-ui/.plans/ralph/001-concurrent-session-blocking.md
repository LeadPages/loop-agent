# Plan: Fix Concurrent Session Blocking

## Problem Statement

When running the landing page generator in one session, the chat input becomes blocked in ALL sessions, not just the active one. Users should be able to work in multiple sessions concurrently.

## Root Cause Analysis

### Current Architecture

```
page.tsx (Dashboard)
├── isLoading: boolean (SINGLE global state)
├── handleSendMessage() → sets isLoading = true
└── Chat component receives isLoading prop
    └── Input disabled when isLoading === true
```

**The Bug**: `isLoading` is a single boolean at the Dashboard level (line 16):
```typescript
const [isLoading, setIsLoading] = useState(false);
```

When ANY session starts processing:
1. `handleSendMessage()` sets `isLoading = true` (line 78)
2. Chat component receives `isLoading={isLoading}` (line 223)
3. ALL chat inputs become disabled because they share the same `isLoading` value

### What Should Happen

Each session should have its own loading state. Session A generating should not block Session B's input.

## Solution Design

### Option A: Per-Session Loading State (Recommended)

Change `isLoading` from a single boolean to a per-session map:

```typescript
// Before
const [isLoading, setIsLoading] = useState(false);

// After
const [loadingSessions, setLoadingSessions] = useState<Set<string>>(new Set());
```

**Pros:**
- Minimal code change
- Clear semantics
- Enables true concurrent sessions

**Cons:**
- None significant

### Option B: Store Loading State in Session Object

Add `isLoading` to the Session interface and store it in the sessions array:

```typescript
interface Session {
  id: string;
  // ... existing fields
  isLoading: boolean;
}
```

**Pros:**
- Loading state travels with session
- Could persist across refreshes if sessions are persisted

**Cons:**
- More invasive change
- Need to update multiple places that modify sessions

### Recommendation: Option A

## Implementation Plan

### Step 1: Update State Definition

```typescript
// page.tsx line 16
// Change from:
const [isLoading, setIsLoading] = useState(false);

// To:
const [loadingSessions, setLoadingSessions] = useState<Set<string>>(new Set());
```

### Step 2: Update handleSendMessage

```typescript
// Before (line 78):
setIsLoading(true);

// After:
setLoadingSessions(prev => new Set(prev).add(activeSessionId));

// Before (line 199, in finally block):
setIsLoading(false);

// After:
setLoadingSessions(prev => {
  const next = new Set(prev);
  next.delete(activeSessionId);
  return next;
});
```

### Step 3: Update Chat Component Props

```typescript
// Before (line 223):
isLoading={isLoading}

// After:
isLoading={loadingSessions.has(activeSessionId)}
```

### Step 4: Derive isLoading for Current Session

Add a derived variable for clarity:

```typescript
const isActiveSessionLoading = activeSessionId
  ? loadingSessions.has(activeSessionId)
  : false;
```

## Backend Considerations

### Does the Backend Support Concurrent Generations?

**Analysis of agent-runner.ts:**

The `runAgent()` and `runLandingPageGenerator()` functions are async generators that:
1. Create a workspace per session (line 41, 142)
2. Use the SDK's `query()` function which spawns separate processes
3. Each session has its own workspace directory

**Conclusion:** YES, the backend architecture supports concurrent generations because:
- Each session has isolated workspace
- SDK processes are independent
- No shared mutable state between sessions

### Potential Issues

1. **Resource contention**: Multiple SDK processes running simultaneously could hit API rate limits or consume significant memory
2. **File system**: Each session writes to its own workspace, so no conflicts

### Mitigation (Optional, Future Work)

- Add a maximum concurrent sessions limit
- Queue additional requests if limit reached
- Show "waiting in queue" UI state

## Testing Plan

1. Create Session A with landing page generator
2. Create Session B with landing page generator
3. Start generation in Session A
4. Verify Session B's input is NOT blocked
5. Start generation in Session B while A is still running
6. Verify both complete successfully
7. Verify preview shows for correct session

## Files to Modify

| File | Changes |
|------|---------|
| `src/app/page.tsx` | Change isLoading to loadingSessions Set, update all usages |

## Estimated Complexity

**Low** - Single file change, straightforward refactor

## Risks

- **Low**: Change is isolated to UI state management
- **Testing**: Need to verify concurrent SDK processes work correctly (they should based on architecture)

## Success Criteria

- [ ] User can type in Session B while Session A is generating
- [ ] Loading indicator shows only for the session that is processing
- [ ] Multiple sessions can generate concurrently without interference
- [ ] Each session's preview shows the correct generated file
