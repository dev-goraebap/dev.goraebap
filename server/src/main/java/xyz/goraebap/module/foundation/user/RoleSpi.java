package xyz.goraebap.module.foundation.user;

import java.util.Collection;
import xyz.goraebap.shared.web.Role;

/** The roles a domain adds to the instance, so instance administrators can give them out. */
public interface RoleSpi {
    Collection<Role> roles();
}
