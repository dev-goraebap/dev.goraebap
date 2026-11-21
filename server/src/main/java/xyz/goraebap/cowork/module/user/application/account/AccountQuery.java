package xyz.goraebap.cowork.module.user.application.account;

import java.util.List;
import xyz.goraebap.cowork.module.user.application.auth.AuthViews;

public interface AccountQuery {
    /** Accounts allowed to sign in, by name; used by the development login list. */
    List<AuthViews.Employee> loginAllowed();
}
