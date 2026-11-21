package xyz.goraebap.foundation.user.application.directory;

import java.util.List;
import java.util.Locale;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import xyz.goraebap.foundation.user.UserFacade;
import xyz.goraebap.foundation.user.application.role.RoleQuery;
import xyz.goraebap.shared.web.AgentActor;

/**
 * The members everyone may see, for picking people (assignees, readers, project members) and drawing them: who may sign
 * in, by name.
 */
@RestController
@RequestMapping("/api/v1/directory")
@RequiredArgsConstructor
public class DirectoryController {
    private final RoleQuery roleQuery;
    private final UserFacade userFacade;

    public record Person(UUID id, String name, String workEmail) {}

    public record Directory(List<Person> people) {
        public Directory {
            people = List.copyOf(people);
        }
    }

    public record Found(UUID id, String name) {}

    @GetMapping("/org-chart")
    @Transactional(readOnly = true)
    public Directory directory() {
        return new Directory(people());
    }

    /** Members whose name or e-mail holds the words, by name. */
    @GetMapping("/employees")
    @Transactional(readOnly = true)
    public List<Found> find(@RequestParam(defaultValue = "") String q) {
        var words = q.trim().toLowerCase(Locale.ROOT);
        return people().stream()
                .filter(person -> words.isEmpty()
                        || person.name().toLowerCase(Locale.ROOT).contains(words)
                        || person.workEmail().toLowerCase(Locale.ROOT).contains(words))
                .map(person -> new Found(person.id(), person.name()))
                .toList();
    }

    /** The agents working for a member, as their pages show beside them. */
    @GetMapping("/employees/{userId}/agents")
    public List<AgentActor> agents(@PathVariable UUID userId) {
        return userFacade.activeAgentsOf(userId);
    }

    private List<Person> people() {
        return roleQuery.findMembers().stream()
                .map(member -> new Person(member.id(), member.name(), member.email()))
                .toList();
    }
}
