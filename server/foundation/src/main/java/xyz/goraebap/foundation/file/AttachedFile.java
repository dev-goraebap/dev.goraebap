package xyz.goraebap.foundation.file;

import java.util.UUID;

/**
 * A file bound to an owner, as lists show it. image tells whether a browser can show it as a picture; a picture may
 * carry the colour to paint its place with (#rrggbb) and its size in pixels, each missing when never measured.
 */
public record AttachedFile(
        UUID id,
        String filename,
        String contentType,
        long size,
        boolean image,
        String dominantColor,
        Integer width,
        Integer height) {}
