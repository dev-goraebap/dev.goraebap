package xyz.goraebap.module.workspace.document.application.box;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 문서함's top beside the shared space's own folders and documents (read with the folder and document lists): a folder
 * for each project, there from the project's making. Every member reads it.
 */
@RestController
@RequestMapping("/api/v1/workspace/document-box")
@RequiredArgsConstructor
public class BoxController {
    private final BoxQueryService boxQueryService;

    /** Every project's folder in the administrators' order, with its last writer's name. */
    @GetMapping("/projects")
    public List<BoxViews.ProjectFolder> projects() {
        return boxQueryService.projects();
    }
}
