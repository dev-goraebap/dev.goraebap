package xyz.goraebap.module.foundation.user.domain.user;

import java.time.Instant;
import java.util.Locale;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import xyz.goraebap.module.foundation.user.NewUser;
import xyz.goraebap.module.foundation.user.UserStatus;
import xyz.goraebap.shared.error.DomainRuleViolation;

/**
 * A member: who they are (name) and where they stand (invited, active, terminated), with the account they sign in
 * with. The e-mail is both the work address and the sign-in address. loginAllowed decides sign-in and follows the
 * status, and onboardedAt whether the first-login onboarding is still to come; the roles a member holds are kept apart
 * (MemberRoles). A terminated member is read-only.
 */
@Getter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@AllArgsConstructor(staticName = "fromPersistence")
public class User {
    public static final int NAME_MAX = NewUser.NAME_MAX;
    public static final int EMAIL_MAX = NewUser.EMAIL_MAX;

    @EqualsAndHashCode.Include
    private final UUID id;

    private String name;
    private String email;
    private UserStatus status;
    private final Instant invitedAt;
    private Instant activatedAt;
    private boolean loginAllowed;
    /** When the member finished the first-login onboarding; null until then. */
    private Instant onboardedAt;

    /**
     * Registers a member. status is INVITED, who waits to start, or ACTIVE, who already works, may sign in and is
     * activated at once; null means INVITED.
     */
    public static User register(UUID id, String name, String email, UserStatus status, Instant now) {
        requireRegistrable(status);
        var user = new User(
                id, validName(name), validEmail(email), UserStatus.INVITED, now, null, false, null);
        if (status == UserStatus.ACTIVE) user.activate(now);
        return user;
    }

    public static void requireRegistrable(UserStatus status) {
        if (status == UserStatus.TERMINATED) throw new DomainRuleViolation("등록 상태는 초대 또는 활성이어야 합니다");
    }

    public void editBasics(String name, String email) {
        requireEditable();
        String validName = validName(name);
        String validEmail = validEmail(email);
        this.name = validName;
        this.email = validEmail;
    }

    public void activate(Instant now) {
        if (status != UserStatus.INVITED) throw new DomainRuleViolation("초대 상태의 구성원만 활성으로 바꿀 수 있습니다");
        this.status = UserStatus.ACTIVE;
        this.activatedAt = now;
        this.loginAllowed = true;
    }

    /** The member can no longer sign in. A domain that keeps a leaving date keeps it itself. */
    public void terminate() {
        requireEditable();
        this.status = UserStatus.TERMINATED;
        this.loginAllowed = false;
    }

    public boolean editable() {
        return status != UserStatus.TERMINATED;
    }

    /** Finishing again keeps the first time, so a second device or a repeated press changes nothing. */
    public void completeOnboarding(Instant at) {
        if (onboardedAt == null) this.onboardedAt = at;
    }

    private void requireEditable() {
        if (!editable()) throw new DomainRuleViolation("비활성 처리된 구성원은 변경할 수 없습니다");
    }

    public static String validName(String raw) {
        if (raw == null || raw.isBlank() || raw.trim().length() > NAME_MAX)
            throw new DomainRuleViolation("이름은 1~" + NAME_MAX + "자여야 합니다");
        return raw.trim();
    }

    /** Lower-cased so the sign-in lookup and the uniqueness check see one spelling. */
    public static String validEmail(String raw) {
        String email = normalEmail(raw);
        int at = email.indexOf('@');
        boolean shape = email.length() >= 3
                && email.length() <= EMAIL_MAX
                && at >= 1
                && at < email.length() - 1
                && email.indexOf('@', at + 1) == -1
                && email.substring(at + 1).contains(".");
        if (!shape) throw new DomainRuleViolation("이메일 형식이 올바르지 않습니다");
        return email;
    }

    public static String normalEmail(String raw) {
        return raw == null ? "" : raw.trim().toLowerCase(Locale.ROOT);
    }
}
