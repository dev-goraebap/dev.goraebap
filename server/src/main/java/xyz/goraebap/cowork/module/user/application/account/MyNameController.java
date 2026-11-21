package xyz.goraebap.cowork.module.user.application.account;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import xyz.goraebap.cowork.module.user.application.AuthErrorCode;
import xyz.goraebap.cowork.module.user.domain.user.UserRepository;
import xyz.goraebap.cowork.shared.web.CurrentUser;

/** The name a member goes by, which they change themselves; others see it from their next read. */
@RestController
@RequestMapping("/api/v1/me/name")
@RequiredArgsConstructor
public class MyNameController {
    private final UserRepository userRepository;

    public record NameChange(@NotBlank @Size(max = 64) String name) {}

    @PutMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void change(@AuthenticationPrincipal CurrentUser user, @Valid @RequestBody NameChange request) {
        var me = userRepository.findByIdForUpdate(user.id()).orElseThrow(AuthErrorCode.AUTH_NOT_FOUND::raise);
        me.editBasics(request.name(), me.email(), me.gender());
        userRepository.save(me, user.id());
    }
}
