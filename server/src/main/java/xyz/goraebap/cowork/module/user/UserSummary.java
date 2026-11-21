package xyz.goraebap.cowork.module.user;

import java.util.UUID;

/** What other modules show for a person: the name. */
public record UserSummary(UUID id, String name) {}
