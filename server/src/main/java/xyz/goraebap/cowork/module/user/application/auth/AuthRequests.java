package xyz.goraebap.cowork.module.user.application.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public final class AuthRequests {
    private AuthRequests() {}

    public record RequestCode(
            @NotBlank @Email @Size(max = 320) String email) {}

    public record Verify(
            @NotBlank @Email @Size(max = 320) String email,
            @NotNull @Pattern(regexp = "[0-9]{6}") String code) {}

    public record DevLogin(@NotNull UUID userId) {}
}
