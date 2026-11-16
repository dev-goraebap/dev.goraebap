package xyz.goraebap.foundation.shared.web;

import java.util.List;
import org.jooq.Field;
import org.jooq.Record;
import org.jooq.impl.DSL;

/**
 * Reading a list a slice at a time after the last row read (keyset), for lists sorted by several keys. The keys are the
 * fields the list is ordered by, each never null (a key that may be missing is coalesced to where missing ones sort),
 * ending with the row's id so no two rows tie. The cursor carries their values as text.
 */
public final class Keyset {
    private Keyset() {}

    /** The last row's key values from a cursor, each bound as its key's type; a cursor that does not fit is invalid. */
    public static Field<?>[] after(String cursor, String sort, List<? extends Field<?>> keys) {
        var values = Cursor.decode(cursor, sort, keys.size());
        try {
            var read = new Field<?>[keys.size()];
            for (int i = 0; i < read.length; i++) read[i] = DSL.val(values.get(i), keys.get(i));
            return read;
        } catch (RuntimeException e) {
            throw Cursor.invalid();
        }
    }

    /** The cursor that continues after this row. */
    public static String next(String sort, Record row, List<? extends Field<?>> keys) {
        return Cursor.encode(
                sort, keys.stream().map(key -> String.valueOf(row.get(key))).toArray(String[]::new));
    }
}
