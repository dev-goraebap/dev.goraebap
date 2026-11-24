---
arc42: "8.2, 8.1, 8.3, 5, 2, 7"
---

# 모듈 공개 계약 Facade와 Spi

다른 모듈이 참조할 계약은 모듈 루트의 Facade 하나로 모으고 구현은 선언한 모듈의 application에 두며, Spi는 선언 모듈 밖에서 구현합니다. 규칙은 [모듈 간 계약](../references/contracts.md)에 있습니다.

## spring

출처: [server/src/main/java/xyz/goraebap/cowork/module/workspace/project/ProjectFacade.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/module/workspace/project/ProjectFacade.java)

```java
public interface ProjectFacade {
    /** The projects of the given ids, archived and deleted ones too, by id. */
    Map<UUID, ProjectSummary> summariesOf(Collection<UUID> ids);

    /** Whether work may name the project: it exists and is not deleted (an archived one may still be named). */
    boolean exists(UUID id);

    /** The project's description, the background its minutes are summarized against; empty when it has none. */
    Optional<String> descriptionOf(UUID id);

    /** The project a key names, its current key or one it had, in any case; deleted ones too. */
    Optional<ProjectSummary> findByKey(String key);
    // …
}
```

`ProjectFacade`는 `module/workspace/project` 루트에 있고 내부 엔티티 대신 같은 루트의 공개 값 `ProjectSummary`를 돌려줍니다. cowork는 Facade 안의 `Param`·`Result` 묶음 대신 모듈 루트의 공개 값 `ProjectSummary`·`NewProject`를 씁니다.

출처: [server/src/main/java/xyz/goraebap/cowork/module/workspace/project/ProjectSetupSpi.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/module/workspace/project/ProjectSetupSpi.java)

```java
/**
 * Implemented by a module that keeps something of its own for every project, such as the issues' board: told within
 * the transaction that made a project, so the project never exists without it.
 */
public interface ProjectSetupSpi {
    void projectCreated(UUID projectId, UUID actor);
}
```

출처: [server/src/main/java/xyz/goraebap/cowork/module/workspace/project/application/ProjectService.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/module/workspace/project/application/ProjectService.java)

```java
@Service
@RequiredArgsConstructor
public class ProjectService implements ProjectFacade {
    // …
    private final List<ProjectSetupSpi> projectSetupSpis;
    // …
    /** A new project made by actor at the given moment, with what every project starts with; the actor its administrator. */
    private Project make(UUID actor, Instant at, NewProject request) {
        var project = Project.create(
                UUID.randomUUID(),
                request.key(),
                request.name(),
                request.description(),
                request.icon(),
                request.color(),
                projectRepository.nextPosition());
        requireFreeKey(project.key(), project.id());
        projectRepository.save(project, actor, at);
        projectRepository.addMember(project.id(), actor, ProjectRole.ADMIN, actor, at);
        projectSetupSpis.forEach(setup -> setup.projectCreated(project.id(), actor));
        signal(project.id());
        return project;
    }
    // …
}
```

출처: [server/src/main/java/xyz/goraebap/cowork/module/workspace/issue/application/board/BoardSetup.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/module/workspace/issue/application/board/BoardSetup.java)

```java
@org.springframework.core.annotation.Order(-10)
@Component
@RequiredArgsConstructor
class BoardSetup implements ProjectSetupSpi {
    private final IssueColumnRepository issueColumnRepository;
    private final Clock clock;

    @Override
    public void projectCreated(UUID projectId, UUID actor) {
        if (issueColumnRepository.findAllByProjectId(projectId).isEmpty())
            issueColumnRepository.saveAll(IssueColumn.defaults(projectId), actor, clock.instant());
    }
}
```

`ProjectService`가 같은 모듈의 application에서 Facade를 구현하고, 프로젝트를 만든 트랜잭션 안에서 등록된 모든 `ProjectSetupSpi`에 알립니다. Spi는 issue 모듈의 `BoardSetup`이 구현해, 프로젝트가 보드 없이 존재하는 일이 없게 합니다. 소비하는 쪽인 issue 모듈의 `IssueProjects`는 `ProjectFacade`를 중계 포트 없이 직접 주입받습니다.
