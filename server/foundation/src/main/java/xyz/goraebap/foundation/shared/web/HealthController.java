package xyz.goraebap.foundation.shared.web;

import java.util.Map;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Whether the server is up and reaches its database, for the image's health check. Public and without a body worth
 * keeping, so it says nothing about the installation.
 */
@RestController
class HealthController {
    private final ObjectProvider<JdbcTemplate> jdbc;

    HealthController(ObjectProvider<JdbcTemplate> jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping(value = "/api/v1/health", produces = "application/json")
    Map<String, String> health() {
        jdbc.ifAvailable(template -> template.queryForObject("SELECT 1", Integer.class));
        return Map.of("status", "UP");
    }
}
