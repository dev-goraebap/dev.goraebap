package xyz.goraebap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.UUID;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import xyz.goraebap.foundation.user.application.auth.SessionService;
import xyz.goraebap.support.Accounts;
import xyz.goraebap.support.Members;
import xyz.goraebap.support.StoredFiles;
import xyz.goraebap.support.TestDatabase;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Tag("integration")
class AvatarTest {
    private static final UUID MEMBER = id(1);
    private static final UUID COLLEAGUE = id(2);
    private static final Instant NOW = Instant.parse("2026-09-21T01:00:00Z");

    private final JsonMapper json = JsonMapper.builder().build();

    @Autowired
    MockMvc mvc;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    SessionService sessions;

    @MockitoBean
    Clock clock;

    @BeforeEach
    void prepare() {
        when(clock.instant()).thenReturn(NOW);
        when(clock.getZone()).thenReturn(ZoneId.of("Asia/Seoul"));
        TestDatabase.clear(jdbc);
        employee(MEMBER, "구성원");
        employee(COLLEAGUE, "동료");
    }

    @Test
    void aMemberChoosesADrawnDefaultAndGoesBackToTheDerivedOne() throws Exception {
        mvc.perform(get("/api/v1/directory/avatars").cookie(cookie(COLLEAGUE)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        change(MEMBER, "{\"preset\":17}").andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/directory/avatars").cookie(cookie(COLLEAGUE)))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].employeeId").value(MEMBER.toString()))
                .andExpect(jsonPath("$[0].preset").value(17));

        change(MEMBER, "{\"preset\":18}").andExpect(status().isBadRequest());
        change(MEMBER, "{}").andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/directory/avatars").cookie(cookie(COLLEAGUE)))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void aPictureIsShownToColleaguesAndANewOneRetiresTheLast() throws Exception {
        String first = pictureOf(MEMBER);
        String firstPath = "/api/v1/directory/avatars/" + MEMBER + "/" + first;
        mvc.perform(get(firstPath).cookie(cookie(COLLEAGUE)))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "image/jpeg"))
                .andExpect(header().string("Cache-Control", "max-age=31536000, private, immutable"));

        assertThat(jdbc.queryForObject(
                        "SELECT width || 'x' || height FROM blob WHERE deleted_at IS NULL", String.class))
                .isEqualTo("512x512");
        String second = pictureOf(MEMBER);
        assertThat(second).isNotEqualTo(first);
        mvc.perform(get(firstPath).cookie(cookie(COLLEAGUE)).accept(MediaType.IMAGE_JPEG, MediaType.ALL))
                .andExpect(status().isNotFound())
                .andExpect(header().string("Content-Type", "application/problem+json"))
                .andExpect(jsonPath("$.code").value("AUTH_NOT_FOUND"));
        mvc.perform(get("/api/v1/directory/avatars/" + COLLEAGUE + "/" + second).cookie(cookie(COLLEAGUE)))
                .andExpect(status().isNotFound());
        assertThat(jdbc.queryForObject("SELECT count(*) FROM blob WHERE deleted_at IS NOT NULL", Integer.class))
                .isEqualTo(1);

        change(MEMBER, "{\"preset\":2}").andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/directory/avatars/" + MEMBER + "/" + second).cookie(cookie(COLLEAGUE)))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/directory/avatars").cookie(cookie(COLLEAGUE)))
                .andExpect(jsonPath("$[0].preset").value(2))
                .andExpect(jsonPath("$[0].pictureId").isEmpty());
    }

    @Test
    void onlyAWholeSquareJpegOfTheRightSizeBecomesAPicture() throws Exception {
        prepare(MEMBER, "얼굴.png", 100).andExpect(status().isBadRequest());
        prepare(MEMBER, "얼굴.jpg", 2 * 1024 * 1024).andExpect(status().isBadRequest());

        change(MEMBER, "{\"uploadId\":\"" + upload(MEMBER, jpeg(256)) + "\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("사진은 512×512 크기여야 합니다"));

        byte[] broken = Arrays.copyOf(jpeg(512), 600);
        change(MEMBER, "{\"uploadId\":\"" + upload(MEMBER, broken) + "\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("FILE_PICTURE_INVALID"));

        change(MEMBER, "{\"preset\":1,\"uploadId\":\"" + upload(MEMBER, jpeg(512)) + "\"}")
                .andExpect(status().isBadRequest());
        change(COLLEAGUE, "{\"uploadId\":\"" + upload(MEMBER, jpeg(512)) + "\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("FILE_UPLOAD_MISSING"));
        assertThat(jdbc.queryForObject("SELECT count(*) FROM attachment", Integer.class))
                .isZero();
    }

    private String pictureOf(UUID member) throws Exception {
        change(member, "{\"uploadId\":\"" + upload(member, jpeg(512)) + "\"}").andExpect(status().isNoContent());
        var chosen = read(mvc.perform(get("/api/v1/directory/avatars").cookie(cookie(member))));
        assertThat(chosen.get(0).get("preset").isNull()).isTrue();
        assertThat(chosen.get(0).get("pictureColor").asString()).isEqualTo("#336699");
        return chosen.get(0).get("pictureId").asString();
    }

    private ResultActions change(UUID member, String body) throws Exception {
        return mvc.perform(
                write(put("/api/v1/me/avatar")).cookie(cookie(member)).content(body));
    }

    private String upload(UUID member, byte[] body) throws Exception {
        var ticket = read(prepare(member, "avatar.jpg", body.length, ",\"dominantColor\":\"#336699\"")
                .andExpect(status().isCreated()));
        assertThat(StoredFiles.send(mvc, ticket, body)).isEqualTo(200);
        return ticket.get("id").asString();
    }

    private ResultActions prepare(UUID member, String filename, long size) throws Exception {
        return prepare(member, filename, size, "");
    }

    private ResultActions prepare(UUID member, String filename, long size, String traits) throws Exception {
        return mvc.perform(write(post("/api/v1/files/uploads"))
                .cookie(cookie(member))
                .content("{\"filename\":\"" + filename + "\",\"size\":" + size + ",\"purpose\":\"AVATAR\"" + traits
                        + "}"));
    }

    private static byte[] jpeg(int side) throws Exception {
        var image = new BufferedImage(side, side, BufferedImage.TYPE_INT_RGB);
        for (int y = 0; y < side; y++) for (int x = 0; x < side; x++) image.setRGB(x, y, (x * 7) ^ (y * 13));
        var out = new ByteArrayOutputStream();
        ImageIO.write(image, "jpeg", out);
        return out.toByteArray();
    }

    private JsonNode read(ResultActions result) throws Exception {
        return json.readTree(result.andReturn().getResponse().getContentAsString());
    }

    private void employee(UUID id, String name) {
        Accounts.upsert(jdbc, id, id + "@example.test", true);
        Members.insert(jdbc, Members.member(id, name, id + "@example.test"));
    }

    private Cookie cookie(UUID user) {
        return new Cookie("cowork_session", sessions.issue(user).token());
    }

    private static UUID id(int value) {
        return UUID.fromString(String.format("00000000-0000-0000-0000-%012d", value));
    }

    private MockHttpServletRequestBuilder write(MockHttpServletRequestBuilder builder) throws Exception {
        var result =
                mvc.perform(get("/api/v1/auth/csrf")).andExpect(status().isOk()).andReturn();
        var tree = json.readTree(result.getResponse().getContentAsString());
        return builder.cookie(result.getResponse().getCookies())
                .header(tree.get("headerName").asString(), tree.get("token").asString())
                .header("Origin", "http://localhost:4402")
                .contentType("application/json");
    }
}
