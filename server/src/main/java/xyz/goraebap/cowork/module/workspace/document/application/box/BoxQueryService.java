package xyz.goraebap.cowork.module.workspace.document.application.box;

import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.goraebap.cowork.module.user.UserFacade;

/** 문서함's top as every member reads it: a folder for each project, names joined once the rows are read. */
@Service
@RequiredArgsConstructor
public class BoxQueryService {
    private final BoxQuery boxQuery;
    private final UserFacade userFacade;

    /** Every project's folder in the administrators' order, with its last writer's name. */
    @Transactional(readOnly = true)
    public List<BoxViews.ProjectFolder> projects() {
        var rows = boxQuery.findProjectFolders();
        var ids = rows.stream()
                .map(BoxViews.ProjectFolder::updatedById)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (ids.isEmpty()) return rows;
        var names = userFacade.summariesOf(ids);
        return rows.stream()
                .map(row -> {
                    var found = row.updatedById() == null ? null : names.get(row.updatedById());
                    return row.named(found == null ? null : found.name());
                })
                .toList();
    }
}
