package xyz.goraebap.foundation.user.domain.user;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Locale;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import xyz.goraebap.foundation.user.Gender;
import xyz.goraebap.foundation.user.NewUser;
import xyz.goraebap.foundation.user.UserStatus;
import xyz.goraebap.shared.error.DomainRuleViolation;

/**
 * A member: who they are (name, gender) and where they stand (invited, working, left), with the account they sign in
 * with. The e-mail is both the work address and the sign-in address. loginAllowed decides sign-in and follows the
 * status, and onboardedAt whether the first-login onboarding is still to come; the roles a member holds are kept apart
 * (MemberRoles). The id is shared with the member's Office record. A member who has left is read-only.
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
    private Gender gender;
    private UserStatus status;
    private final Instant invitedAt;
    private Instant activatedAt;
    private LocalDate terminatedAt;
    private boolean loginAllowed;
    /** When the member finished the first-login onboarding; null until then. */
    private Instant onboardedAt;

    /**
     * Registers a member. status is INVITED, who waits to start, or ACTIVE, who already works, may sign in and is
     * activated at once; null means INVITED.
     */
    public static User register(UUID id, String name, String email, Gender gender, UserStatus status, Instant now) {
        requireRegistrable(status);
        var user = new User(
                id, validName(name), validEmail(email), gender, UserStatus.INVITED, now, null, null, false, null);
        if (status == UserStatus.ACTIVE) user.activate(now);
        return user;
    }

    public static void requireRegistrable(UserStatus status) {
        if (status == UserStatus.TERMINATED) throw new DomainRuleViolation("등록 상태는 입사대기 또는 재직중이어야 합니다");
    }

    public void editBasics(String name, String email, Gender gender) {
        requireEditable();
        String validName = validName(name);
        String validEmail = validEmail(email);
        this.name = validName;
        this.email = validEmail;
        this.gender = gender;
    }

    public void activate(Instant now) {
        if (status != UserStatus.INVITED) throw new DomainRuleViolation("초대 상태의 사원만 재직으로 전환할 수 있습니다");
        this.status = UserStatus.ACTIVE;
        this.activatedAt = now;
        this.loginAllowed = true;
    }

    /** terminationDate is the official leaving date the administrator enters, not the processing time. */
    public void terminate(LocalDate terminationDate) {
        requireEditable();
        if (terminationDate == null) throw new DomainRuleViolation("퇴사일을 입력해 주세요");
        this.status = UserStatus.TERMINATED;
        this.terminatedAt = terminationDate;
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
        if (!editable()) throw new DomainRuleViolation("퇴사 처리된 사원은 변경할 수 없습니다");
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
        if (!shape) throw new DomainRuleViolation("업무 이메일 형식이 올바르지 않습니다");
        return email;
    }

    public static String normalEmail(String raw) {
        return raw == null ? "" : raw.trim().toLowerCase(Locale.ROOT);
    }
}
