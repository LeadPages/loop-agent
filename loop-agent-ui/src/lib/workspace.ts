import fs from "fs";
import path from "path";

// Workspace root directory - use WORKSPACES_PATH (preferred) or WORKSPACE_ROOT (legacy)
// Local default: data/workspaces (relative to cwd)
// Docker/Railway: /loop-data/workspaces (set via env)
const WORKSPACES_PATH = process.env.WORKSPACES_PATH
  || process.env.WORKSPACE_ROOT
  || path.join(process.cwd(), "data/workspaces");

/**
 * Get the workspace path for a session
 */
export function getWorkspacePath(sessionId: string): string {
  return path.join(WORKSPACES_PATH, sessionId);
}

/**
 * Create a workspace directory for a session
 */
export function createWorkspace(sessionId: string): string {
  const workspacePath = getWorkspacePath(sessionId);

  if (!fs.existsSync(workspacePath)) {
    fs.mkdirSync(workspacePath, { recursive: true });
  }

  return workspacePath;
}

/**
 * Check if a workspace exists
 */
export function workspaceExists(sessionId: string): boolean {
  const workspacePath = getWorkspacePath(sessionId);
  return fs.existsSync(workspacePath);
}

/**
 * Delete a workspace directory and all its contents
 */
export function deleteWorkspace(sessionId: string): boolean {
  const workspacePath = getWorkspacePath(sessionId);

  if (fs.existsSync(workspacePath)) {
    fs.rmSync(workspacePath, { recursive: true, force: true });
    return true;
  }

  return false;
}

/**
 * Initialize a workspace with optional starter content
 */
export function initializeWorkspace(
  sessionId: string,
  options?: {
    readme?: string;
    files?: Array<{ path: string; content: string }>;
  }
): string {
  const workspacePath = createWorkspace(sessionId);

  if (options?.readme) {
    fs.writeFileSync(
      path.join(workspacePath, "README.md"),
      options.readme
    );
  }

  if (options?.files) {
    for (const file of options.files) {
      const filePath = path.join(workspacePath, file.path);
      const fileDir = path.dirname(filePath);

      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }

      fs.writeFileSync(filePath, file.content);
    }
  }

  return workspacePath;
}

/**
 * List files in a workspace
 */
export function listWorkspaceFiles(sessionId: string): string[] {
  const workspacePath = getWorkspacePath(sessionId);

  if (!fs.existsSync(workspacePath)) {
    return [];
  }

  const files: string[] = [];

  function walkDir(dir: string, prefix: string = "") {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const relativePath = path.join(prefix, entry.name);

      if (entry.isDirectory()) {
        // Skip hidden directories and node_modules
        if (!entry.name.startsWith(".") && entry.name !== "node_modules") {
          walkDir(path.join(dir, entry.name), relativePath);
        }
      } else {
        files.push(relativePath);
      }
    }
  }

  walkDir(workspacePath);
  return files;
}

export { WORKSPACES_PATH };
