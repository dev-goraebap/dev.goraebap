package xyz.goraebap.foundation.mcp;

import java.util.List;

/**
 * A module's MCP tools (cowork-guide-agent-access). Each module registers its own from its application layer, as it has
 * its own controllers, so a tool runs the same Service and the same rules as the screens; the mcp module only serves
 * them.
 */
public interface McpToolProvider {
    List<McpTool> tools();
}
