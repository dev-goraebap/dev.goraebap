package xyz.goraebap.module.foundation.mcp.application;

import io.modelcontextprotocol.common.McpTransportContext;
import io.modelcontextprotocol.json.McpJsonMapper;
import io.modelcontextprotocol.json.jackson3.JacksonMcpJsonMapper;
import io.modelcontextprotocol.server.McpServer;
import io.modelcontextprotocol.server.McpStatelessServerFeatures.SyncToolSpecification;
import io.modelcontextprotocol.server.McpStatelessSyncServer;
import io.modelcontextprotocol.server.transport.HttpServletStatelessServerTransport;
import io.modelcontextprotocol.spec.McpSchema;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.web.servlet.ServletRegistrationBean;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import xyz.goraebap.module.foundation.mcp.McpServerProfileSpi;
import xyz.goraebap.shared.config.ProductSettings;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.servlet.HandlerMapping;
import xyz.goraebap.module.foundation.mcp.McpArguments;
import xyz.goraebap.module.foundation.mcp.McpTool;
import xyz.goraebap.module.foundation.mcp.McpToolProvider;
import xyz.goraebap.shared.error.BusinessException;
import xyz.goraebap.shared.error.DomainRuleViolation;
import xyz.goraebap.shared.web.CurrentUser;
import tools.jackson.databind.json.JsonMapper;

/**
 * The MCP server at /api/mcp: Streamable HTTP without sessions, every request one
 * JSON-RPC message answered with JSON and carrying its own agent token, so nothing lives between requests and a restart
 * drops no agent. The security chain signs the token's member in (a session cookie alone is refused there); the tools
 * are the modules' (McpToolProvider) and run as that member.
 *
 * <p>Each request is recorded once in the activity record as the API's requests are: as /api/mcp, with the agent's name
 * and, for a tool call, the tool's, where a mapping's path values go.
 */
@Configuration(proxyBeanMethods = false)
class McpServerConfig {
    static final String ENDPOINT = "/api/mcp";
    private static final String ACTOR = "actor";
    private static final String REQUEST = "request";
    private static final Logger LOG = LoggerFactory.getLogger(McpServerConfig.class);
    /** The rules that hold for any product; a profile's own instructions follow them. */
    private static final String INSTRUCTIONS =
            "당신은 토큰 주인인 구성원의 권한으로 일하며, 한 일은 그 사람과 에이전트 이름으로 기록됩니다. "
                    + "볼 수 없는 것은 '찾을 수 없음'으로 답합니다. 화면에서 할 수 없는 일은 도구로도 할 수 없습니다.";

    @Bean
    HttpServletStatelessServerTransport mcpTransport(JsonMapper jsonMapper) {
        return HttpServletStatelessServerTransport.builder()
                .jsonMapper(new JacksonMcpJsonMapper(jsonMapper))
                .messageEndpoint(ENDPOINT)
                // The security chain has already signed the token's member in for this request.
                .contextExtractor(McpServerConfig::context)
                .maxRequestSize(1_048_576)
                .build();
    }

    @Bean
    ServletRegistrationBean<HttpServletStatelessServerTransport> mcpServlet(
            HttpServletStatelessServerTransport transport) {
        return new ServletRegistrationBean<>(transport, ENDPOINT);
    }

    @Bean(destroyMethod = "close")
    McpStatelessSyncServer mcpServer(
            HttpServletStatelessServerTransport transport,
            List<McpToolProvider> providers,
            ObjectProvider<McpServerProfileSpi> profile,
            ProductSettings product,
            JsonMapper jsonMapper) {
        var mapper = new JacksonMcpJsonMapper(jsonMapper);
        var tools = providers.stream()
                .flatMap(provider -> provider.tools().stream())
                .toList();
        var names = new HashSet<String>();
        for (var tool : tools)
            if (!names.add(tool.name())) throw new IllegalStateException("MCP tool registered twice: " + tool.name());
        return McpServer.sync(transport)
                .serverInfo(product.name(), "1")
                .instructions(instructions(profile.getIfAvailable()))
                .capabilities(
                        McpSchema.ServerCapabilities.builder().tools(false).build())
                .jsonMapper(mapper)
                .immediateExecution(true)
                .tools(tools.stream()
                        .map(tool -> spec(tool, mapper, profile.getIfAvailable()))
                        .toList())
                .build();
    }

    /** The member the request acts for, and the request itself for the activity record. */
    private static McpTransportContext context(HttpServletRequest request) {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CurrentUser actor))
            return McpTransportContext.EMPTY;
        record(request, actor, null);
        return McpTransportContext.create(Map.of(ACTOR, actor, REQUEST, request));
    }

    private static String instructions(McpServerProfileSpi profile) {
        return profile == null ? INSTRUCTIONS : INSTRUCTIONS + System.lineSeparator() + profile.instructions();
    }

    private static SyncToolSpecification spec(McpTool tool, McpJsonMapper mapper, McpServerProfileSpi profile) {
        var definition = McpSchema.Tool.builder()
                .name(tool.name())
                .title(tool.title())
                .description(tool.description())
                .inputSchema(tool.inputSchema())
                .annotations(new McpSchema.ToolAnnotations(
                        tool.title(), tool.readOnly(), tool.destructive(), null, false, null))
                .build();
        return new SyncToolSpecification(definition, (context, request) -> call(tool, context, request, mapper, profile));
    }

    /** Runs a tool for the token's member: its answer as JSON, or what went wrong as the tool's error to read. */
    private static McpSchema.CallToolResult call(
            McpTool tool,
            McpTransportContext context,
            McpSchema.CallToolRequest request,
            McpJsonMapper mapper,
            McpServerProfileSpi profile) {
        if (!(context.get(ACTOR) instanceof CurrentUser actor) || !actor.agent())
            return error("에이전트 토큰으로 연결해야 합니다. 내 계정 › 에이전트 토큰에서 만든 토큰을 Authorization: Bearer로 보내세요.");
        if (context.get(REQUEST) instanceof HttpServletRequest httpRequest) record(httpRequest, actor, tool.name());
        try {
            Object value = tool.handler().call(actor, new McpArguments(request.arguments()));
            var result = McpSchema.CallToolResult.builder().addTextContent(mapper.writeValueAsString(value));
            if (profile != null && context.get(REQUEST) instanceof HttpServletRequest httpRequest) {
                var notice = profile.noticeFor(tool.name(), httpRequest);
                if (notice != null) result.addTextContent(notice);
            }
            return result.isError(false).build();
        } catch (BusinessException failure) {
            return error(failure.errorCode().code() + ": " + failure.getMessage());
        } catch (AccessDeniedException denied) {
            return error("AUTH_FORBIDDEN: " + denied.getMessage());
        } catch (IllegalArgumentException invalid) {
            return error(invalid.getMessage());
        } catch (DomainRuleViolation rule) {
            return error(rule.getMessage());
        } catch (IOException | RuntimeException failure) {
            LOG.error("MCP tool {} failed", tool.name(), failure);
            return error("도구를 실행하지 못했습니다. 잠시 뒤 다시 시도하세요.");
        }
    }

    /**
     * Names the request in the activity record (the system module's request recording, which reads a mapping's pattern
     * and path values): the endpoint, the agent and the tool called, if any. The record never holds the arguments.
     */
    private static void record(HttpServletRequest request, CurrentUser actor, String toolName) {
        var target = new LinkedHashMap<String, String>();
        if (toolName != null) target.put("tool", toolName);
        target.put("agent", actor.agentName());
        request.setAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE, ENDPOINT);
        request.setAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE, target);
    }

    private static McpSchema.CallToolResult error(String message) {
        return McpSchema.CallToolResult.builder()
                .addTextContent(message)
                .isError(true)
                .build();
    }
}
