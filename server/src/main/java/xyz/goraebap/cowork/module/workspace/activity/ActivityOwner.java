package xyz.goraebap.cowork.module.workspace.activity;

import java.util.UUID;

/** Whose timeline it is: the owner's type and id, the same its rich body has (PROJECT_ISSUE, PROJECT_DOCUMENT …). */
public record ActivityOwner(String type, UUID id) {}
