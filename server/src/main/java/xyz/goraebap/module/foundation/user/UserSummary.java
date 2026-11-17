package xyz.goraebap.module.foundation.user;

import java.util.UUID;

/** What other modules show for a person: the name and, when assigned, the department. */
public record UserSummary(UUID id, String name, String affiliationName) {}
