package xyz.goraebap.cowork.module.user.application.setup;

import java.time.Clock;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.goraebap.cowork.module.user.UserStatus;
import xyz.goraebap.cowork.module.user.application.AuthErrorCode;
import xyz.goraebap.cowork.module.user.domain.role.RoleRepository;
import xyz.goraebap.cowork.module.user.domain.user.User;
import xyz.goraebap.cowork.module.user.domain.user.UserRepository;
import xyz.goraebap.cowork.shared.web.Role;

@Service
@RequiredArgsConstructor
public class SetupService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final Clock clock;

    @Transactional(readOnly = true)
    public boolean needed() {
        return !userRepository.anyExists();
    }

    /**
     * Registers the install's first member, who may sign in at once and runs both the instance and the workspace.
     * Two first starts at once go one after another under the write lock, and the later one is refused.
     */
    @Transactional
    public void createFirstAdmin(String name, String email) {
        userRepository.lockAdminChanges();
        if (userRepository.anyExists()) throw AuthErrorCode.AUTH_SETUP_DONE.raise();
        var id = UUID.randomUUID();
        userRepository.save(User.register(id, name, email, null, UserStatus.ACTIVE, clock.instant()), id);
        var roles = roleRepository.findByUserId(id);
        roles.grant(Role.INSTANCE_ADMIN);
        roles.grant(Role.WORKSPACE_ADMIN);
        roleRepository.save(roles, id);
    }
}
