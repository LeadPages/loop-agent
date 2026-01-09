import { query } from "@anthropic-ai/claude-agent-sdk";

// Define tools available to the coding agent
const CODING_TOOLS = [
  "Read",   // Read files
  "Write",  // Create new files
  "Edit",   // Edit existing files
  "Bash",   // Run shell commands
  "Glob",   // Find files by pattern
  "Grep",   // Search file contents
];

// System prompt to give the agent context about its role
const SYSTEM_PROMPT = `You are a coding assistant with access to file system and shell tools.

Your capabilities:
- Read, write, and edit files
- Run shell commands
- Search for files and content using glob patterns and grep

When helping with coding tasks:
- Explore the codebase first to understand the structure
- Make minimal, focused changes
- Prefer editing existing files over creating new ones
- Test changes when possible using available build/test commands`;

async function main() {
  // Get prompt from command line args or use a default
  const prompt = process.argv[2] || "What files are in this directory?";

  console.log(`Running coding agent with prompt: "${prompt}"\n`);

  try {
    // Run the agent query
    for await (const message of query({
      prompt,
      options: {
        systemPrompt: SYSTEM_PROMPT,
        allowedTools: CODING_TOOLS,
        // Use bypassPermissions for automated workflows (requires allowDangerouslySkipPermissions)
        // permissionMode: "bypassPermissions",
        // allowDangerouslySkipPermissions: true,
      },
    })) {
      // Handle different message types
      switch (message.type) {
        case "system":
          // Initial system message with session info
          if (message.subtype === "init") {
            console.log(`Session started: ${message.session_id}`);
            console.log(`Model: ${message.model}`);
            console.log(`Tools: ${message.tools.join(", ")}\n`);
          }
          break;

        case "assistant":
          // Assistant messages contain Claude's responses
          for (const block of message.message.content) {
            if (block.type === "text") {
              console.log(block.text);
            } else if (block.type === "tool_use") {
              console.log(`\n[Using tool: ${block.name}]`);
            }
          }
          break;

        case "result":
          // Final result message
          console.log("\n---");
          if (message.subtype === "success") {
            console.log(`Result: ${message.result}`);
            console.log(`Cost: $${message.total_cost_usd.toFixed(4)}`);
            console.log(`Turns: ${message.num_turns}`);
          } else {
            console.log(`Error: ${message.subtype}`);
            if ("errors" in message) {
              console.log(message.errors.join("\n"));
            }
          }
          break;
      }
    }
  } catch (error) {
    console.error("Agent error:", error);
    process.exit(1);
  }
}

main();
