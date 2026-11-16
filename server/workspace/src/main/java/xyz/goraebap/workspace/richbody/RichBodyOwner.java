package xyz.goraebap.workspace.richbody;

import java.util.UUID;

/**
 * Whose body it is: the owner's file type and id, under which the body's files are bound, and the address its files
 * open from (fileBase/{attachmentId}, behind the owner's own read check).
 */
public record RichBodyOwner(String type, UUID id, String fileBase) {}
