package xyz.goraebap.foundation.shared.web;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import xyz.goraebap.foundation.shared.error.CommonErrorCode;

/**
 * Where a list stopped: the sort it was read in and the values of its last row. Clients hand it back unread to get the
 * rows after that one. A cursor from another sort, or one that does not decode, is an invalid request.
 */
public final class Cursor {
    private static final String SEPARATOR = "\u001f";

    private Cursor() {}

    public static String encode(String sort, String... values) {
        String joined = sort + SEPARATOR + String.join(SEPARATOR, values);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(joined.getBytes(StandardCharsets.UTF_8));
    }

    /** The values of the last row, checked to come from the same sort and to have as many values as it needs. */
    public static List<String> decode(String cursor, String sort, int values) {
        try {
            var parts = List.of(
                    new String(Base64.getUrlDecoder().decode(cursor), StandardCharsets.UTF_8).split(SEPARATOR, -1));
            if (parts.size() != values + 1 || !parts.getFirst().equals(sort)) throw invalid();
            return parts.subList(1, parts.size());
        } catch (IllegalArgumentException e) {
            throw invalid();
        }
    }

    /** A cursor this server did not make, answered as a request to start the list over. */
    public static RuntimeException invalid() {
        return CommonErrorCode.COMMON_INVALID_REQUEST.raise("목록 위치가 올바르지 않습니다. 처음부터 다시 불러와 주세요");
    }
}
