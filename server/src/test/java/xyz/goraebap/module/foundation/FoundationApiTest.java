package xyz.goraebap.module.foundation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@org.springframework.test.context.ActiveProfiles("test")
@AutoConfigureMockMvc
@Tag("integration")
class FoundationApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void healthSaysTheServerReachesItsDatabase() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
        assertThat(jdbcTemplate.queryForObject(
                        "SELECT count(*) FROM sqlite_master WHERE name='branding_settings'", Integer.class))
                .isZero();
    }

    @Test
    void unknownApiIsAProblemInsteadOfHtml() throws Exception {
        mockMvc.perform(get("/api/v1/missing"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.code").exists())
                .andExpect(jsonPath("$.traceId").isNotEmpty());
    }

    @Test
    void openApiDescribesThePublicHealthContract() throws Exception {
        String spec = mockMvc.perform(get("/api/openapi"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        assertThat(spec).contains("/api/v1/health");
        if (Boolean.getBoolean("exportOpenApi")) {
            Files.writeString(Path.of("openapi.json"), spec);
        }
    }
}
