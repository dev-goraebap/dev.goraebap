package xyz.goraebap.cowork.shared.web;

/**
 * Which way a list runs by its sort key: up (ASC) or down (DESC). Lists whose order can be chosen take it beside the
 * key they sort by.
 */
public enum SortDirection {
    ASC,
    DESC;

    /** The sort name a cursor carries, the key and this direction ("KEY_DIRECTION"), so another order's is refused. */
    public String cursorName(Enum<?> key) {
        return key.name() + "_" + name();
    }
}
