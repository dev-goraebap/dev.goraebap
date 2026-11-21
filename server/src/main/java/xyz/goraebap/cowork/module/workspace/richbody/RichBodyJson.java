package xyz.goraebap.cowork.module.workspace.richbody;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * JSON objects of the body editor as the contracts carry them, before Map.copyOf makes them read-only: a key whose value
 * is null is left out, as JSON reads a missing key (Map.copyOf takes no nulls); nested values are kept as they came.
 */
public final class RichBodyJson {
    private RichBodyJson() {}

    public static Map<String, Object> present(Map<String, Object> object) {
        var present = new LinkedHashMap<String, Object>();
        object.forEach((key, value) -> {
            if (key != null && value != null) present.put(key, value);
        });
        return present;
    }
}
