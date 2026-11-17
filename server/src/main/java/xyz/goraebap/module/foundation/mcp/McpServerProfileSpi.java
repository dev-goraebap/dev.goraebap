package xyz.goraebap.module.foundation.mcp;

import jakarta.servlet.http.HttpServletRequest;

/**
 * What the assembled product tells agents about itself: how to work with its tools, and anything to add to a tool's
 * answer for one request (a newer plugin to install, say). Without one the server gives only the general rules.
 */
public interface McpServerProfileSpi {
    /** The instructions an agent reads when it connects. */
    String instructions();

    /** A note to add to the named tool's answer for this request, or null. */
    default String noticeFor(String toolName, HttpServletRequest request) {
        return null;
    }
}
