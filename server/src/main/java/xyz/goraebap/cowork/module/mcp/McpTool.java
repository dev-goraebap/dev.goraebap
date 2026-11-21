package xyz.goraebap.cowork.module.mcp;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import xyz.goraebap.cowork.shared.web.CurrentUser;

/**
 * One MCP tool: its name, what it is for (read by the agent choosing it), its arguments as a JSON schema, whether it
 * only reads, and what it does for the token's member. The handler answers a value written as JSON for the agent; a
 * business error or a bad argument becomes the tool's error, its message the agent's to read.
 */
public record McpTool(
        String name,
        String title,
        String description,
        Map<String, Object> inputSchema,
        boolean readOnly,
        boolean destructive,
        Handler handler) {
    public McpTool {
        Objects.requireNonNull(name);
        Objects.requireNonNull(description);
        inputSchema = Map.copyOf(inputSchema);
        Objects.requireNonNull(handler);
    }

    /** A tool that only reads. */
    public static McpTool read(String name, String title, String description, Input input, Handler handler) {
        return new McpTool(name, title, description, input.build(), true, false, handler);
    }

    /** A tool that changes something, recorded with the member and the agent. */
    public static McpTool write(String name, String title, String description, Input input, Handler handler) {
        return new McpTool(name, title, description, input.build(), false, false, handler);
    }

    /** A destructive tool, also advertised as such to MCP clients. */
    public static McpTool remove(String name, String title, String description, Input input, Handler handler) {
        return new McpTool(name, title, description, input.build(), false, true, handler);
    }

    @FunctionalInterface
    public interface Handler {
        Object call(CurrentUser actor, McpArguments arguments);
    }

    /** A tool's arguments as a JSON schema object, built a property at a time. */
    public static Input input() {
        return new Input();
    }

    public static final class Input {
        private final Map<String, Object> properties = new LinkedHashMap<>();
        private final List<String> required = new ArrayList<>();

        private Input() {}

        public Input string(String name, String description, boolean isRequired) {
            return property(name, Map.of("type", "string", "description", description), isRequired);
        }

        public Input choice(String name, String description, List<String> values, boolean isRequired) {
            return property(
                    name,
                    Map.of("type", "string", "description", description, "enum", List.copyOf(values)),
                    isRequired);
        }

        public Input strings(String name, String description, boolean isRequired) {
            return property(
                    name,
                    Map.of("type", "array", "description", description, "items", Map.of("type", "string")),
                    isRequired);
        }

        public Input bool(String name, String description) {
            return property(name, Map.of("type", "boolean", "description", description), false);
        }

        public Input objects(
                String name, String description, Input item, int minimum, int maximum, boolean isRequired) {
            return property(
                    name,
                    Map.of(
                            "type",
                            "array",
                            "description",
                            description,
                            "items",
                            item.build(),
                            "minItems",
                            minimum,
                            "maxItems",
                            maximum),
                    isRequired);
        }

        public Input integer(String name, String description, int minimum, int maximum) {
            return integer(name, description, minimum, maximum, false);
        }

        public Input integer(String name, String description, int minimum, int maximum, boolean isRequired) {
            return property(
                    name,
                    Map.of("type", "integer", "description", description, "minimum", minimum, "maximum", maximum),
                    isRequired);
        }

        public Input number(String name, String description, double minimum, double maximum, boolean isRequired) {
            return property(
                    name,
                    Map.of("type", "number", "description", description, "minimum", minimum, "maximum", maximum),
                    isRequired);
        }

        private Input property(String name, Map<String, Object> schema, boolean isRequired) {
            properties.put(name, schema);
            if (isRequired) required.add(name);
            return this;
        }

        Map<String, Object> build() {
            var schema = new LinkedHashMap<String, Object>();
            schema.put("type", "object");
            schema.put("properties", Map.copyOf(properties));
            schema.put("required", List.copyOf(required));
            schema.put("additionalProperties", false);
            return schema;
        }
    }
}
