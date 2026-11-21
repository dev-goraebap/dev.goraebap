package xyz.goraebap.cowork.module.seed;

import tools.jackson.databind.JsonNode;

/**
 * One shape of seed file, implemented by the module whose records it brings (cowork-guide-architecture, 개발 서버 채우기):
 * it knows a file of its shape by the top-level keys and brings the file in, within the transaction the seed module
 * opened for that file, through its own services' importer paths, which keep who wrote what and when and tell nobody.
 * Throwing fails the whole file, which is then left to be fixed and tried again.
 */
public interface SeedFormatSpi {
    /** A short name for the log and the import record, such as "issues". */
    String name();

    /**
     * Where it comes among the shapes: files of a lower order go first, so a file that makes a project comes before one
     * that only puts things in it.
     */
    int order();

    /** Whether a file, read as JSON, has this shape. */
    boolean accepts(JsonNode file);

    /** Brings the file in; what was made comes back in a few words ("SAFE 이슈 155 · 댓글 112"). */
    String load(JsonNode file, SeedAuthors authors);
}
