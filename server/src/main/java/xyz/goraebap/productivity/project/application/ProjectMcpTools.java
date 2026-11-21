package xyz.goraebap.productivity.project.application;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import xyz.goraebap.foundation.mcp.McpTool;
import xyz.goraebap.foundation.mcp.McpToolProvider;

/** Projects as an agent reads them, through the same service as the projects area's screens. */
@Component
@RequiredArgsConstructor
public class ProjectMcpTools implements McpToolProvider {
    private final ProjectService projectService;

    @Override
    public List<McpTool> tools() {
        return List.of(
                McpTool.read(
                        "list_projects",
                        "프로젝트 목록",
                        "프로젝트를 화면 순서대로 돌려줍니다: 키, 이름, 설명, 멤버 수, 내 즐겨찾기인지. 보관한 프로젝트는 include_archived가 true일 때만 함께 줍니다. 이슈는 프로젝트 키로 찾습니다.",
                        McpTool.input().bool("include_archived", "보관한 프로젝트도 함께 볼지 (기본 false)"),
                        (actor, arguments) -> {
                            var projects = new ArrayList<Map<String, Object>>();
                            projectService
                                    .list(actor, new ProjectRequests.Listing(ProjectRequests.Status.ACTIVE))
                                    .forEach(project -> projects.add(project(project)));
                            if (arguments.bool("include_archived").orElse(false))
                                projectService
                                        .list(actor, new ProjectRequests.Listing(ProjectRequests.Status.ARCHIVED))
                                        .forEach(project -> projects.add(project(project)));
                            return projects;
                        }),
                McpTool.read(
                        "get_project",
                        "프로젝트 보기",
                        "프로젝트 하나를 키로(예전 키도 됨) 돌려줍니다: 이름, 설명, 보관 여부, 멤버(이름·부서). 보드의 상태(칸)와 라벨은 get_project_board로 봅니다.",
                        McpTool.input().string("project", "프로젝트 키 (예: cowork)", true),
                        (actor, arguments) -> {
                            String key = arguments.string("project");
                            var project = project(projectService.get(actor, key));
                            project.put(
                                    "members",
                                    projectService.members(actor, key).stream()
                                            .map(member -> {
                                                var view = new LinkedHashMap<String, Object>();
                                                view.put("name", member.name());
                                                return view;
                                            })
                                            .toList());
                            return project;
                        }));
    }

    private static Map<String, Object> project(ProjectViews.ProjectView project) {
        var view = new LinkedHashMap<String, Object>();
        view.put("key", project.key());
        view.put("name", project.name());
        view.put("description", project.description());
        view.put("archived", project.archivedAt() != null);
        view.put("memberCount", project.memberCount());
        view.put("favorite", project.favorite());
        view.put("path", "/workspace/projects/" + project.key());
        return view;
    }
}
