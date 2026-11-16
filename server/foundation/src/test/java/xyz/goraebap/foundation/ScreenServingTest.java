package xyz.goraebap.foundation;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.forwardedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.hamcrest.Matchers;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

/** The image serves the built screens; test resources hold a stand-in under static/. */
@SpringBootTest
@org.springframework.test.context.ActiveProfiles("test")
@AutoConfigureMockMvc
@Tag("integration")
class ScreenServingTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void anAddressOfTheAppGetsThePageWithoutSignIn() throws Exception {
        mockMvc.perform(get("/calendar/2026-10"))
                .andExpect(status().isOk())
                .andExpect(content().string(Matchers.containsString("<title>screens</title>")))
                .andExpect(header().string("Cache-Control", "no-cache"));
        mockMvc.perform(get("/")).andExpect(status().isOk()).andExpect(forwardedUrl("/index.html"));
    }

    @Test
    void hashedFilesAreKeptAndTheServiceWorkerIsReadAgain() throws Exception {
        mockMvc.perform(get("/assets/app-3f2a1c.js"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", Matchers.containsString("immutable")));
        mockMvc.perform(get("/sw.js"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-cache"));
    }

    @Test
    void theInstallManifestIsServedAsOne() throws Exception {
        mockMvc.perform(get("/manifest.webmanifest"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", Matchers.startsWith("application/manifest+json")));
    }

    @Test
    void aMissingFileIsNotThePage() throws Exception {
        mockMvc.perform(get("/assets/gone-000000.js")).andExpect(status().isNotFound());
        mockMvc.perform(get("/favicon.ico")).andExpect(status().isNotFound());
        mockMvc.perform(get("/missing.png")).andExpect(status().isNotFound());
        mockMvc.perform(get("/calendar/missing.webmanifest")).andExpect(status().isNotFound());
    }

    @Test
    void anAddressWithoutAnExtensionIsStillTheApps() throws Exception {
        mockMvc.perform(get("/calendar/days/2026-10-14"))
                .andExpect(status().isOk())
                .andExpect(content().string(Matchers.containsString("<title>screens</title>")));
        mockMvc.perform(get("/meetings/0f8fad5b-d9cb-469f-a165-70867728950e/edit"))
                .andExpect(status().isOk())
                .andExpect(content().string(Matchers.containsString("<title>screens</title>")));
    }

    @Test
    void theApiStillAsksForSignIn() throws Exception {
        mockMvc.perform(get("/api/v1/missing"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }
}
