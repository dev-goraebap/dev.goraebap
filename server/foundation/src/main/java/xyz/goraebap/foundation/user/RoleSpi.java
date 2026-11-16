package xyz.goraebap.foundation.user;

import java.util.Collection;
import xyz.goraebap.foundation.shared.web.Role;

/** The roles a domain adds to the instance, so instance administrators can give them out. */
public interface RoleSpi {
    Collection<Role> roles();
}
