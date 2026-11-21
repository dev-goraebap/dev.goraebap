package xyz.goraebap.cowork.module.user.application.role;

import java.util.Arrays;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Each time the server starts, the members named in app.auth.instance-admin-emails become instance administrators, so
 * a new install, or one whose instance administrators have all left, has someone to give out roles.
 */
@Component
class InstanceAdminBootstrap {
    private final RoleService roleService;
    private final String instanceAdminEmails;

    InstanceAdminBootstrap(
            RoleService roleService, @Value("${app.auth.instance-admin-emails:}") String instanceAdminEmails) {
        this.roleService = roleService;
        this.instanceAdminEmails = instanceAdminEmails;
    }

    @EventListener(ApplicationReadyEvent.class)
    void grant() {
        var emails = Arrays.stream(instanceAdminEmails.split(","))
                .map(String::trim)
                .filter(email -> !email.isEmpty())
                .toList();
        if (!emails.isEmpty()) roleService.grantInstanceAdmins(emails);
    }
}
