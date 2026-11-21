package xyz.goraebap.productivity.richbody.application;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** What a link card in a body shows of the page it points to. Any signed-in member may ask. */
@RestController
@RequestMapping("/api/v1/workspace/link-previews")
@RequiredArgsConstructor
public class LinkPreviewController {
    private final LinkPreviews linkPreviews;

    @GetMapping
    public LinkPreviews.LinkPreview preview(@RequestParam String url) {
        return linkPreviews.preview(url);
    }
}
