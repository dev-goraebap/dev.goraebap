package xyz.goraebap.workspace.activity;

import java.util.UUID;
import xyz.goraebap.foundation.shared.web.AgentActor;

/** 인증된 실행 주체. 과거·외부 기록처럼 확인할 수 없으면 source는 비운다. */
public record ActivityActor(UUID userId, String source, AgentActor agent) {}
