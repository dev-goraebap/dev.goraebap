package xyz.goraebap.productivity.issue.domain.code;

import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Work item references written in a repository (BIT D-087): `P2-6` in a commit message, a pull request's title or body,
 * or a branch (`p2-6-login-fix`, `feature/P2-6`), in any letter case. Matching one to the project is the caller's.
 */
public final class References {
    private static final Pattern REF =
            Pattern.compile("(?i)(?<![A-Za-z0-9])([A-Za-z][A-Za-z0-9]{1,9})-([1-9][0-9]{0,8})(?![A-Za-z0-9])");

    private References() {}

    /** The references a text names, upper-cased, in order of first mention. */
    public static Set<String> refs(String text) {
        var found = new LinkedHashSet<String>();
        if (text == null) return found;
        var match = REF.matcher(text);
        while (match.find()) found.add(match.group(1).toUpperCase(Locale.ROOT) + "-" + match.group(2));
        return found;
    }
}
