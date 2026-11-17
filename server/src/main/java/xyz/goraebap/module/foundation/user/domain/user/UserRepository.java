package xyz.goraebap.module.foundation.user.domain.user;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import xyz.goraebap.module.foundation.user.UserStatus;

public interface UserRepository {
    Optional<User> findById(UUID id);

    /**
     * Changes that may take away an instance administrator (a member leaving, roles changing) run one after another
     * under the database's write lock, so two of them cannot each remove one of the last.
     */
    void lockAdminChanges();

    Optional<User> findByIdForUpdate(UUID id);

    /** The status of whoever else uses the e-mail, including members who have left; e-mails are unique across all. */
    Optional<UserStatus> statusOfEmailOwner(String email, UUID exceptId);

    /** The given e-mails that someone uses, with that member's status, including members who have left. */
    Map<String, UserStatus> statusesByEmail(Collection<String> emails);

    /** The ids of the members who may sign in, by the given e-mails in their one spelling; unknown e-mails are left out. */
    Map<String, UUID> findActiveIdsByEmail(Collection<String> emails);

    void save(User user, UUID actor);

    void saveAll(List<User> users, UUID actor);
}
