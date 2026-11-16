package xyz.goraebap.workspace.richbody.application;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import xyz.goraebap.workspace.richbody.RichBodyFacade;
import xyz.goraebap.workspace.richbody.RichBodyMarkdown;

/** Converts a caller's draft without reading or writing a document. */
@RestController
@RequestMapping("/api/v1/workspace/body-conversions")
@RequiredArgsConstructor
public class BodyConversionController {
    private final RichBodyFacade richBody;

    @PostMapping("/rich")
    public RichDraft toRich(@Valid @RequestBody MarkdownDraft input) {
        return new RichDraft(richBody.fromMarkdown(input.markdown()));
    }

    @PostMapping("/markdown")
    public MarkdownDraft toMarkdown(@Valid @RequestBody RichDraft input) {
        if (!"doc".equals(input.body().get("type"))) throw RichBodyErrorCode.RICH_BODY_INVALID.raise();
        return new MarkdownDraft(RichBodyMarkdown.toDraftMarkdown(input.body()));
    }

    public record RichDraft(@NotNull Map<String, Object> body) {
        public RichDraft {
            body = body == null ? null : Collections.unmodifiableMap(new LinkedHashMap<>(body));
        }
    }

    public record MarkdownDraft(
            @NotNull @Size(max = 100_000) String markdown) {}
}
