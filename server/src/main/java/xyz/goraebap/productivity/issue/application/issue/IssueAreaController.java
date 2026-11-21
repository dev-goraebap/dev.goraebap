package xyz.goraebap.productivity.issue.application.issue;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import xyz.goraebap.shared.web.CurrentUser;

/**
 * The projects area's issues across every live project (이슈 in the area's menu), and one issue by the reference people
 * and agents write, KEY-number.
 */
@RestController
@RequestMapping("/api/v1/workspace/issues")
@RequiredArgsConstructor
public class IssueAreaController {
    private final IssueService issueService;

    /** Issues matching the search across projects, a slice at a time, by default the latest changed first. */
    @GetMapping
    public IssueViews.IssueSlice list(
            @AuthenticationPrincipal CurrentUser user,
            @Valid @ParameterObject @ModelAttribute IssueRequests.Listing listing) {
        return issueService.listAll(user, listing);
    }

    @GetMapping("/groups")
    public java.util.List<IssueViews.IssueGroup> groups(
            @AuthenticationPrincipal CurrentUser user,
            @Valid @ParameterObject @ModelAttribute IssueRequests.Listing listing,
            @org.springframework.web.bind.annotation.RequestParam IssueRequests.Grouping grouping) {
        return issueService.groups(user, null, listing, grouping);
    }

    @GetMapping("/{ref}")
    public IssueViews.IssueView get(@AuthenticationPrincipal CurrentUser user, @PathVariable String ref) {
        return issueService.getByRef(user, ref);
    }
}
