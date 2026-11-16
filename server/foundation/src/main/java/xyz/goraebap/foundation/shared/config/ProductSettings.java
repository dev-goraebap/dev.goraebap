package xyz.goraebap.foundation.shared.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * What the assembled product calls itself wherever the server shows it (mail subjects, push titles, the MCP server's
 * name), and what its agent tokens start with. The assembly sets it; this module names no product.
 */
@ConfigurationProperties("app.product")
public record ProductSettings(@DefaultValue("app") String name, String tokenScheme) {
    public ProductSettings {
        if (name == null || name.isBlank()) throw new IllegalArgumentException("app.product.name is required");
        if (tokenScheme == null || tokenScheme.isBlank()) tokenScheme = name.toLowerCase(java.util.Locale.ROOT) + "_";
        if (!tokenScheme.matches("[a-z][a-z0-9]{1,30}_"))
            throw new IllegalArgumentException("app.product.token-scheme must be lowercase letters and digits ending in _");
    }
}
