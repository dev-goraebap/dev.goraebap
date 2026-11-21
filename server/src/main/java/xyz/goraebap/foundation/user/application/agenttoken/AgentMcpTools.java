package xyz.goraebap.foundation.user.application.agenttoken;

import java.time.Clock;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import xyz.goraebap.foundation.mcp.McpTool;
import xyz.goraebap.foundation.mcp.McpToolProvider;

/** Who the agent acts for: the token's member, the roles they hold, the agent's name and today's date in Seoul. */
@Component
@RequiredArgsConstructor
public class AgentMcpTools implements McpToolProvider {
    private final Clock clock;

    @Override
    public List<McpTool> tools() {
        return List.of(McpTool.read(
                "whoami",
                "나는 누구",
                "에이전트 토큰의 주인(이름·이메일·역할), 토큰에 적힌 에이전트 이름, 오늘 날짜(Asia/Seoul)를 돌려줍니다. 작업을 시작할 때 누구의 권한으로 일하는지 확인하세요.",
                McpTool.input(),
                (actor, arguments) -> {
                    var me = new LinkedHashMap<String, Object>();
                    me.put("id", actor.id());
                    if (actor instanceof AgentTokenViews.Agent agent) {
                        me.put("name", agent.name());
                        me.put("email", agent.email());
                    }
                    me.put("roles", actor.roles());
                    me.put("agentName", actor.agentName());
                    me.put("today", LocalDate.now(clock));
                    return me;
                }));
    }
}
