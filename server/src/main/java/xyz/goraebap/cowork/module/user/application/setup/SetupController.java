package xyz.goraebap.cowork.module.user.application.setup;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * The first start of an install: while nobody is registered, anyone who opens it may make the first administrator, who
 * then signs in as everyone does (a code by e-mail). Once someone is registered it is closed for good.
 */
@RestController
@RequestMapping("/api/v1/setup")
@RequiredArgsConstructor
public class SetupController {
    private final SetupService setupService;

    /** Whether the install still waits for its first administrator. */
    public record SetupState(boolean needed) {}

    public record FirstAdmin(
            @NotBlank @Size(max = 64) String name,
            @NotBlank @Email @Size(max = 254) String email) {}

    @GetMapping
    public SetupState state() {
        return new SetupState(setupService.needed());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void create(@Valid @RequestBody FirstAdmin request) {
        setupService.createFirstAdmin(request.name(), request.email());
    }
}
