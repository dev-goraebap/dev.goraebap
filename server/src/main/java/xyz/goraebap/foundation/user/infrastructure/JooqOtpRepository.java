package xyz.goraebap.foundation.user.infrastructure;

import static org.jooq.impl.DSL.excluded;
import static xyz.goraebap.jooq.tables.IamOtp.IAM_OTP;

import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.goraebap.foundation.user.domain.otp.Otp;
import xyz.goraebap.foundation.user.domain.otp.OtpRepository;

@Repository
@RequiredArgsConstructor
class JooqOtpRepository implements OtpRepository {
    private final DSLContext dslContext;

    public Optional<Otp> findByUserIdForUpdate(UUID userId) {
        return dslContext
                .selectFrom(IAM_OTP)
                .where(IAM_OTP.USER_ACCOUNT_ID.eq(userId))
                .fetchOptional()
                .map(row -> Otp.fromPersistence(
                        row.getUserAccountId(),
                        row.getCodeHash(),
                        row.getIssuedAt(),
                        row.getExpiresAt(),
                        row.getAttempts(),
                        row.getConsumed()));
    }

    public void save(Otp otp) {
        dslContext
                .insertInto(IAM_OTP)
                .set(IAM_OTP.USER_ACCOUNT_ID, otp.userId())
                .set(IAM_OTP.CODE_HASH, otp.hash())
                .set(IAM_OTP.ISSUED_AT, otp.issuedAt())
                .set(IAM_OTP.EXPIRES_AT, otp.expiresAt())
                .set(IAM_OTP.ATTEMPTS, otp.attempts())
                .set(IAM_OTP.CONSUMED, otp.consumed())
                .onConflict(IAM_OTP.USER_ACCOUNT_ID)
                .doUpdate()
                .set(IAM_OTP.CODE_HASH, excluded(IAM_OTP.CODE_HASH))
                .set(IAM_OTP.ISSUED_AT, excluded(IAM_OTP.ISSUED_AT))
                .set(IAM_OTP.EXPIRES_AT, excluded(IAM_OTP.EXPIRES_AT))
                .set(IAM_OTP.ATTEMPTS, excluded(IAM_OTP.ATTEMPTS))
                .set(IAM_OTP.CONSUMED, excluded(IAM_OTP.CONSUMED))
                .execute();
    }

    public void discard(Otp otp) {
        dslContext
                .deleteFrom(IAM_OTP)
                .where(IAM_OTP.USER_ACCOUNT_ID.eq(otp.userId()))
                .and(IAM_OTP.CODE_HASH.eq(otp.hash()))
                .execute();
    }
}
