package xyz.goraebap.module.workspace.richbody.application;

import java.net.URI;
import java.util.Optional;

/** Reads the start of a public web page for its metadata. */
public interface PageReader {
    /** The markup read, and the address it came from once redirects were followed. */
    record Page(URI address, String html) {}

    /** Empty when the address is not a public HTTPS page, or the page did not answer with HTML in time. */
    Optional<Page> read(URI address);
}
