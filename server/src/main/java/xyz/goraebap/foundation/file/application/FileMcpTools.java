package xyz.goraebap.foundation.file.application;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import xyz.goraebap.foundation.file.domain.upload.FileFormat;
import xyz.goraebap.foundation.file.domain.upload.ImageTraits;
import xyz.goraebap.foundation.file.domain.upload.UploadPurpose;
import xyz.goraebap.foundation.mcp.McpArguments;
import xyz.goraebap.foundation.mcp.McpTool;
import xyz.goraebap.foundation.mcp.McpToolProvider;
import xyz.goraebap.shared.web.CurrentUser;

/**
 * Lets an agent put a picture or a file into a body, the way the editor does: it asks here for where to send the bytes,
 * sends them itself (curl), and names the upload in the Markdown it writes (attachment:{id}); saving the body binds the
 * upload to the document or issue, under the same checks as the screens (format, size, who may write there). An upload
 * no body takes is removed after a day.
 */
@Component
@RequiredArgsConstructor
class FileMcpTools implements McpToolProvider {
    private final FileService fileService;

    @Override
    public List<McpTool> tools() {
        return List.of(McpTool.write(
                "prepare_file_upload",
                "파일 올릴 주소 받기",
                "문서·이슈 본문에 넣을 사진이나 파일을 올릴 주소를 받습니다. 순서: (1) 이 도구로 주소를 받고 (2) 돌려받은 curl 명령으로 "
                        + "10분 안에 파일을 올린 뒤 (3) 돌려받은 markdown(![설명](attachment:id) 또는 [이름](attachment:id))을 "
                        + "create_document·update_document·update_document_section·set_issue_body의 본문에 한 줄로 넣습니다. "
                        + "본문을 저장할 때 그 문서·이슈에 붙고, 하루 안에 어느 본문에도 넣지 않으면 지워집니다. "
                        + "형식은 확장자로 정하고, 사진(png·jpg·gif·webp 등)은 사진 블록으로, 그 밖의 파일(pdf·docx·xlsx·zip·html 등)은 "
                        + "파일 블록으로 들어갑니다(html은 본문 안 미리보기). 오디오는 올릴 수 없습니다. 웹 편집기와 같이 한 파일 "
                        + UploadPurpose.EVIDENCE.limitText() + "까지이고, 한 문서·이슈에 붙은 파일을 모두 합쳐도 "
                        + UploadPurpose.EVIDENCE.limitText() + "까지입니다(사진이 많으면 줄여서 올리세요). size에는 정확한 바이트 수를 줍니다.",
                McpTool.input()
                        .string("filename", "파일 이름 (확장자로 형식을 정합니다. 예: login-screen.png)", true)
                        .integer("size", "파일 크기(바이트). 올리는 파일과 정확히 같아야 합니다", 1, Integer.MAX_VALUE, true)
                        .integer("width", "사진의 가로(px). 알면 주세요: 사진 자리를 먼저 잡습니다", 1, ImageTraits.MAX_SIDE)
                        .integer("height", "사진의 세로(px)", 1, ImageTraits.MAX_SIDE),
                this::prepare));
    }

    private Object prepare(CurrentUser actor, McpArguments arguments) {
        String filename = arguments.string("filename").strip();
        Integer width = arguments.has("width") ? arguments.integer("width", 0) : null;
        Integer height = arguments.has("height") ? arguments.integer("height", 0) : null;
        var ticket = fileService.prepare(
                actor,
                new FileRequests.Upload(
                        filename, (long) arguments.integer("size", 0), UploadPurpose.EVIDENCE, null, width, height));
        URI url = absolute(ticket.url());
        boolean image = FileFormat.ofFilename(filename).map(FileFormat::image).orElse(false);
        String label = filename.replaceAll("[\\[\\]\\n]", " ").strip();
        var result = new LinkedHashMap<String, Object>();
        result.put("uploadId", ticket.id());
        result.put("method", ticket.method());
        result.put("url", url.toString());
        result.put("headers", ticket.headers());
        result.put("expiresAt", ticket.expiresAt());
        result.put(
                "curl",
                "curl -sS --fail -X " + ticket.method() + " "
                        + ticket.headers().entrySet().stream()
                                .map(header -> "-H \"" + header.getKey() + ": " + header.getValue() + "\" ")
                                .collect(Collectors.joining())
                        + "--data-binary @\"<파일 경로>\" \"" + url + "\"");
        result.put("markdown", (image ? "!" : "") + "[" + label + "](attachment:" + ticket.id() + ")");
        result.put(
                "next",
                image
                        ? "올린 뒤 markdown을 본문의 원하는 자리에 한 줄로 넣으세요. ![…]의 글은 사진 설명(대체 글)이 됩니다."
                        : "올린 뒤 markdown을 본문의 원하는 자리에 한 줄로 넣으세요. 파일 블록으로 보입니다.");
        return result;
    }

    /** Storage on this machine answers a path of this server; an agent needs the whole address. */
    private static URI absolute(URI url) {
        if (url.isAbsolute()) return url;
        return URI.create(ServletUriComponentsBuilder.fromCurrentContextPath()
                        .build()
                        .toUriString())
                .resolve(url);
    }
}
