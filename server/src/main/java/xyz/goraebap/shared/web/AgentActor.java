package xyz.goraebap.shared.web;

import java.util.UUID;

/** 활동에 남길 실행 당시 에이전트 정체성. 인증 비밀값은 포함하지 않는다. */
public record AgentActor(UUID id, String name, String icon, String color) {}
