package xyz.goraebap.cowork.module.mcp.application;

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
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.servlet.HandlerMapping;
import tools.jackson.databind.json.JsonMapper;
import xyz.goraebap.cowork.module.mcp.McpArguments;
import xyz.goraebap.cowork.module.mcp.McpTool;
import xyz.goraebap.cowork.module.mcp.McpToolProvider;
import xyz.goraebap.cowork.shared.error.BusinessException;
import xyz.goraebap.cowork.shared.error.DomainRuleViolation;
import xyz.goraebap.cowork.shared.web.CurrentUser;

/**
 * cowork's MCP server at /api/mcp (cowork-guide-agent-access): Streamable HTTP without sessions, every request one
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
    private static final String INSTRUCTIONS = """
            cowork(cowork)는 회사의 오피스 업무(일정·회의록·결재 …)와 프로젝트·이슈·문서를 한곳에서 다루는 사내 플랫폼입니다. 당신은 토큰 주인인 구성원의 권한으로 일하며, 한 일은 그 사람과 에이전트 이름으로 기록됩니다.
            이슈는 KEY-번호 참조로, 프로젝트는 키로, 사람·라벨·상태(보드 칸)는 화면에 보이는 이름으로 지정합니다. 나는 me, 비우기는 해당 도구가 지원하는 none입니다. 사용할 연결과 프로젝트는 요청과 프로젝트 지침에서 확인합니다.
            유형은 list_issue_types로 현재 코드·이름·기본값·순서를 조회하고 선택합니다. 유형 이름이나 개수를 고정하지 않습니다. 칸과 라벨은 get_project_board로 확인합니다.
            이슈를 기록할 때는 list_issues로 기존 작업을 찾고 get_issue로 읽습니다. 새 이슈는 별도로 추적할 일이 있을 때 만듭니다. 조회나 대화마다 이슈를 만들지 않습니다. 진행 중인 작업의 후속 교정은 같은 이슈에 남기고 출시 후 발견한 버그는 새 이슈로 연결합니다.
            상세 작성 기준은 cowork 플러그인을 따릅니다. 담당·날짜·라벨·완료 시점과 계층 정책은 프로젝트 지침을 우선합니다. 정해진 값을 다시 묻거나 기한을 지어내지 않습니다.
            일을 시작할 때 진행 중으로, 마치면 검토·완료로 옮깁니다. 진행 중이 되면 비어 있는 담당(토큰 주인)과 시작일(오늘)이, 완료되면 비어 있는 기한(오늘)이 채워지고 그 시각이 남습니다. 우선순위를 생략하면 보통입니다.
            상태는 update_issue의 column(칸 이름)이나 status(backlog/unstarted/started/completed/canceled)로 옮깁니다. 상태 변경에는 update_issue의 comment로 한 일·검증·남은 일을 함께 남깁니다. 취소(canceled)에는 이유를 적습니다. 중간 진행은 comment_issue로 남기고, 본문 전체를 고칠 때만 set_issue_body를 씁니다(이전 본문은 버전으로 남습니다).
            문서는 유지할 요구사항·설계·유즈케이스를 담고, 이슈는 이번에 수행할 일과 진행을 담습니다. 같은 본문을 복제하지 말고 연결합니다. 문서함에 문서를 만들거나 고치는 일은 이슈로 만들지 않습니다.
            쓰기 전에 list_documents·list_issues로 관련 자료를 찾고 조회한 경로로 연결합니다. 본문은 확장 Markdown이며 <!-- block:id --> 보존 표시는 유지합니다. 명시적으로 삭제할 블록만 drop_blocks로 지정합니다. 사진·파일은 prepare_file_upload → 바이트 업로드 → attachment:id 본문 저장 순서이며, 문서는 한 절 수정(update_document_section)을 먼저 검토하고 쓴 뒤 다시 읽습니다.
            요청에 필요한 MCP 도구가 없거나, 반복 호출·도구 구성·설명·인자·응답이 불편하면 실제 도구 스키마를 확인하고 문제와 개선안을 사용자에게 먼저 제안합니다. 인증·권한 부족을 기능 누락과 구분합니다. cowork 제품 저장소를 개발 중이면 직접 구현할지, 일반 사용자라면 개선 피드백을 올릴지 묻습니다. 동의 없이 구현하거나 피드백을 등록하지 않으며, 가능한 원래 작업은 이어서 처리합니다. 제출 경로가 없으면 민감한 정보를 뺀 초안을 전달하고 미접수임을 알립니다. 상세 절차는 플러그인의 갱신과 피드백 지침을 따릅니다.
            볼 수 없는 것은 '찾을 수 없음'으로 답합니다. 화면에서 할 수 없는 일은 도구로도 할 수 없습니다. 문서 삭제는 delete_document·delete_documents를 사용합니다. 기본 dry_run=true로 하위 페이지까지 범위를 확인하고, 사용자가 요청한 삭제만 dry_run=false로 실행합니다. expectedVersion은 메타데이터 version이며 bodyVersion이 아닙니다. 다중 삭제는 항목별 결과를 확인하고 성공한 항목을 재시도하지 않습니다.
            cowork 플러그인의 최신 판은 {latest}입니다. 플러그인의 all 스킬(0.10 이하에서는 cowork 스킬)에 적힌 판이 이보다 낮으면 사용자의 첫 요청을 처리하기 전에 한 번만 갱신을 제안하고, 방법은 그 스킬의 갱신과 피드백 안내를 따릅니다.""";
    /** The header the Claude plugin sends with its installed version (plugins/cowork/claude/mcp.json). */
    static final String PLUGIN_HEADER = "X-Cowork-Plugin";
    /** The tools an agent calls when it starts, which carry the notice of a newer plugin. */
    private static final Set<String> NOTICE_TOOLS = Set.of("whoami", "changes_since");

    static final String PLUGIN_VERSION = pluginVersion();

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
            HttpServletStatelessServerTransport transport, List<McpToolProvider> providers, JsonMapper jsonMapper) {
        var mapper = new JacksonMcpJsonMapper(jsonMapper);
        var tools = providers.stream()
                .flatMap(provider -> provider.tools().stream())
                .toList();
        var names = new HashSet<String>();
        for (var tool : tools)
            if (!names.add(tool.name())) throw new IllegalStateException("MCP tool registered twice: " + tool.name());
        return McpServer.sync(transport)
                .serverInfo("cowork", "1")
                .instructions(INSTRUCTIONS.replace("{latest}", PLUGIN_VERSION))
                .capabilities(
                        McpSchema.ServerCapabilities.builder().tools(false).build())
                .jsonMapper(mapper)
                .immediateExecution(true)
                .tools(tools.stream().map(tool -> spec(tool, mapper)).toList())
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

    private static SyncToolSpecification spec(McpTool tool, McpJsonMapper mapper) {
        var definition = McpSchema.Tool.builder()
                .name(tool.name())
                .title(tool.title())
                .description(tool.description())
                .inputSchema(tool.inputSchema())
                .annotations(new McpSchema.ToolAnnotations(
                        tool.title(), tool.readOnly(), tool.destructive(), null, false, null))
                .build();
        return new SyncToolSpecification(definition, (context, request) -> call(tool, context, request, mapper));
    }

    /** Runs a tool for the token's member: its answer as JSON, or what went wrong as the tool's error to read. */
    private static McpSchema.CallToolResult call(
            McpTool tool, McpTransportContext context, McpSchema.CallToolRequest request, McpJsonMapper mapper) {
        if (!(context.get(ACTOR) instanceof CurrentUser actor) || !actor.agent())
            return error("에이전트 토큰으로 연결해야 합니다. cowork 내 계정 › 에이전트 토큰에서 만든 토큰을 Authorization: Bearer로 보내세요.");
        if (context.get(REQUEST) instanceof HttpServletRequest httpRequest) record(httpRequest, actor, tool.name());
        try {
            Object value = tool.handler().call(actor, new McpArguments(request.arguments()));
            var result = McpSchema.CallToolResult.builder().addTextContent(mapper.writeValueAsString(value));
            if (NOTICE_TOOLS.contains(tool.name()) && context.get(REQUEST) instanceof HttpServletRequest httpRequest) {
                var notice = updateNotice(httpRequest.getHeader(PLUGIN_HEADER));
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

    /**
     * What the agent tells its member when the plugin they run is older than the one this server ships, or null. Only the
     * Claude plugin says its version (a header); Codex compares the version in its skill with the instructions.
     */
    static String updateNotice(String installed) {
        if (installed == null || installed.isBlank() || compare(PLUGIN_VERSION, installed.strip()) <= 0) return null;
        return ("cowork 플러그인 새 판이 있습니다(설치된 판 %s, 최신 판 %s). 사용자의 첫 요청을 처리하기 전에 한 번만 갱신을 제안합니다. "
                        + "동의하면 `claude plugin marketplace update cowork`와 `claude plugin update cowork@cowork`를 "
                        + "차례로 실행하고 `/reload-plugins`로 바로 적용할 수 있다고 알립니다. 거절하면 다시 묻지 않습니다.")
                .formatted(installed.strip(), PLUGIN_VERSION);
    }

    /** Compares dotted numeric versions, ignoring a pre-release tail: positive when a is newer. */
    static int compare(String a, String b) {
        var x = a.split("-")[0].split("\\.");
        var y = b.split("-")[0].split("\\.");
        for (int i = 0; i < Math.max(x.length, y.length); i++) {
            int diff = part(x, i) - part(y, i);
            if (diff != 0) return diff;
        }
        return 0;
    }

    private static int part(String[] parts, int index) {
        if (index >= parts.length) return 0;
        try {
            return Integer.parseInt(parts[index]);
        } catch (NumberFormatException notNumber) {
            return 0;
        }
    }

    private static String pluginVersion() {
        try (InputStream in = McpServerConfig.class.getResourceAsStream("/mcp/cowork-plugin.properties")) {
            if (in == null) throw new IllegalStateException("mcp/cowork-plugin.properties가 없습니다");
            try (var reader = new java.io.InputStreamReader(in, java.nio.charset.StandardCharsets.UTF_8)) {
                var properties = new Properties();
                properties.load(reader);
                return properties.getProperty("version").strip();
            }
        } catch (IOException failure) {
            throw new UncheckedIOException(failure);
        }
    }

    private static McpSchema.CallToolResult error(String message) {
        return McpSchema.CallToolResult.builder()
                .addTextContent(message)
                .isError(true)
                .build();
    }
}
