package xyz.goraebap.module.foundation.search;

/**
 * A thing found: its id, title, the text around the words when the title does not hold them (null when it does), where
 * it stands (a reference, a project, a day or a writer), and the screen address that opens it.
 */
public record SearchHit(String id, String title, String excerpt, String where, String path) {}
