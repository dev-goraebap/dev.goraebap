package xyz.goraebap.module.foundation.user.application.account;

import java.util.List;
import xyz.goraebap.module.foundation.user.application.auth.AuthViews;

public interface AccountQuery {
    /** Accounts allowed to sign in, by name; used by the development login list. */
    List<AuthViews.Member> loginAllowed();
}
