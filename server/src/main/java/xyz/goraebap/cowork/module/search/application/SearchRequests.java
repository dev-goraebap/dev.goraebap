package xyz.goraebap.cowork.module.search.application;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Objects;

public final class SearchRequests {
    private SearchRequests() {}

    /** The words to find and how many of each kind to answer (5 when not given). */
    public record Search(
            @NotBlank @Size(max = 100) String q,
            @Min(1) @Max(MAX_SIZE) Integer size) {
        public static final int DEFAULT_SIZE = 5;
        public static final int MAX_SIZE = 20;

        public Search {
            q = q == null ? null : q.strip();
            size = Objects.requireNonNullElse(size, DEFAULT_SIZE);
        }
    }
}
