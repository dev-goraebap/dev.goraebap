package xyz.goraebap.module.foundation.mcp;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * A tool call's arguments, read by name. A missing required argument or a value of the wrong shape is the agent's to
 * correct, so it is an IllegalArgumentException whose message says which argument and why, in the words the tool's
 * error shows. "none" is how an agent clears a value it may also set (an assignee, a date).
 */
public final class McpArguments {
    /** The word that clears a value. */
    public static final String NONE = "none";

    private final Map<String, Object> values;

    public McpArguments(Map<String, Object> values) {
        this.values = values == null
                ? Map.of()
                : values.entrySet().stream()
                        .filter(entry -> entry.getValue() != null)
                        .collect(Collectors.toUnmodifiableMap(Map.Entry::getKey, Map.Entry::getValue));
    }

    public boolean has(String name) {
        return values.containsKey(name);
    }

    public String string(String name) {
        return optionalString(name).orElseThrow(() -> new IllegalArgumentException(name + " 값이 필요합니다."));
    }

    /** The text given, trimmed; empty text counts as not given. */
    public Optional<String> optionalString(String name) {
        Object value = values.get(name);
        if (value == null) return Optional.empty();
        if (!(value instanceof String text)) throw new IllegalArgumentException(name + "는 문자열이어야 합니다.");
        return text.isBlank() ? Optional.empty() : Optional.of(text.strip());
    }

    /** The text given as it was, line breaks and all; for bodies and comments. */
    public Optional<String> text(String name) {
        Object value = values.get(name);
        if (value == null) return Optional.empty();
        if (!(value instanceof String text)) throw new IllegalArgumentException(name + "는 문자열이어야 합니다.");
        return Optional.of(text);
    }

    public Optional<List<String>> strings(String name) {
        Object value = values.get(name);
        if (value == null) return Optional.empty();
        if (!(value instanceof List<?> list) || !list.stream().allMatch(String.class::isInstance))
            throw new IllegalArgumentException(name + "는 문자열 배열이어야 합니다.");
        return Optional.of(list.stream()
                .map(String.class::cast)
                .map(String::strip)
                .filter(each -> !each.isEmpty())
                .toList());
    }

    public Optional<Boolean> bool(String name) {
        Object value = values.get(name);
        if (value == null) return Optional.empty();
        if (!(value instanceof Boolean flag)) throw new IllegalArgumentException(name + "는 true 또는 false여야 합니다.");
        return Optional.of(flag);
    }

    public int integer(String name, int fallback) {
        Object value = values.get(name);
        if (value == null) return fallback;
        if (!(value instanceof Number number)) throw new IllegalArgumentException(name + "는 숫자여야 합니다.");
        return number.intValue();
    }

    /** A number given as a JSON number (1.5); absent when not given. */
    public Optional<Double> number(String name) {
        Object value = values.get(name);
        if (value == null) return Optional.empty();
        if (!(value instanceof Number number)) throw new IllegalArgumentException(name + "는 숫자여야 합니다.");
        return Optional.of(number.doubleValue());
    }

    /** Required integral numbers without truncation or overflow, for optimistic versions. */
    public long longInteger(String name) {
        if (!(values.get(name) instanceof Number number)) throw new IllegalArgumentException(name + "는 정수여야 합니다.");
        try {
            return new java.math.BigDecimal(number.toString()).longValueExact();
        } catch (ArithmeticException | NumberFormatException invalid) {
            throw new IllegalArgumentException(name + "는 정수 범위 안의 값이어야 합니다.");
        }
    }

    @SuppressWarnings("unchecked")
    public List<McpArguments> objects(String name) {
        if (!(values.get(name) instanceof List<?> items)) throw new IllegalArgumentException(name + "는 객체 배열이어야 합니다.");
        return items.stream()
                .map(value -> {
                    if (!(value instanceof Map<?, ?> map)
                            || !map.keySet().stream().allMatch(String.class::isInstance))
                        throw new IllegalArgumentException(name + "의 각 항목은 객체여야 합니다.");
                    return new McpArguments((Map<String, Object>) map);
                })
                .toList();
    }

    /** One of the choices, ignoring case, as its upper-case name. */
    public <E extends Enum<E>> Optional<E> choice(String name, Class<E> type) {
        return optionalString(name).map(text -> {
            try {
                return Enum.valueOf(type, text.toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException unknown) {
                throw new IllegalArgumentException(name + "는 "
                        + Arrays.stream(type.getEnumConstants())
                                .map(each -> each.name().toLowerCase(Locale.ROOT))
                                .collect(Collectors.joining(", "))
                        + " 중 하나여야 합니다.");
            }
        });
    }

    /** A day as YYYY-MM-DD. */
    public Optional<LocalDate> date(String name) {
        return optionalString(name).map(text -> {
            try {
                return LocalDate.parse(text);
            } catch (DateTimeParseException invalid) {
                throw new IllegalArgumentException(name + "는 YYYY-MM-DD 형식이어야 합니다.");
            }
        });
    }

    /** Whether the argument was given as "none", to clear what it names. */
    public boolean cleared(String name) {
        return optionalString(name).map(NONE::equalsIgnoreCase).orElse(false);
    }
}
