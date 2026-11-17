package xyz.goraebap.module.foundation.support;

import java.net.URI;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import tools.jackson.databind.JsonNode;

/**
 * The browser's side of a file upload in tests. Tests keep the files on this machine (LocalObjectStorage), whose
 * presigned URLs point at this server, so the bytes go through MockMvc the way a browser sends them to R2.
 */
public final class StoredFiles {
    private StoredFiles() {}

    /** Sends body to the URL of an upload ticket with its method and headers; returns the status the server gave. */
    public static int send(MockMvc mvc, JsonNode ticket, byte[] body) throws Exception {
        var request = MockMvcRequestBuilders.request(
                        HttpMethod.valueOf(ticket.get("method").asString()),
                        URI.create(ticket.get("url").asString()))
                .content(body);
        ticket.get("headers")
                .properties()
                .forEach(
                        entry -> request.header(entry.getKey(), entry.getValue().asString()));
        return mvc.perform(request).andReturn().getResponse().getStatus();
    }

    /** Opens a presigned download URL. */
    public static MockHttpServletResponse open(MockMvc mvc, String url) throws Exception {
        return mvc.perform(MockMvcRequestBuilders.get(URI.create(url)))
                .andReturn()
                .getResponse();
    }
}
