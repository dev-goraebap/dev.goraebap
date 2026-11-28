# 코드 스타일과 네이밍 (Spring Boot)

## 코드 품질 도구 역할 분리

세 도구가 겹치지 않게 책임을 나눕니다. `build/generated-sources/` 아래 jOOQ 생성 코드는 셋 모두에서 제외합니다.

| 도구 | 담당 범위 | 설정 위치 | 실행 명령 |
| - | - | - | - |
| **Spotless** | 포맷 재작성 (`palantirJavaFormat`, 미사용 import 제거, 어노테이션 정렬) | `build.gradle` | `./gradlew spotlessApply` / `spotlessCheck` |
| **Checkstyle** | import 위생, 명명, 결함 유발 패턴, 구조 (`maxWarnings = 0`) | `config/checkstyle/checkstyle.xml` | `./gradlew checkstyleMain checkstyleTest` |
| **SpotBugs** | 바이트코드 기반 잠재 결함(널 참조, 가변 노출, 반환값 무시 등) | `config/spotbugs/exclude.xml` | `./gradlew spotbugsMain spotbugsTest` |

- Checkstyle에는 들여쓰기·줄길이 같은 포맷 규칙을 넣지 않습니다. 포맷은 Spotless가 자동으로 고칩니다.
- Checkstyle 주요 검사 항목: `AvoidStarImport`, `UnusedImports`, `EqualsHashCode`, `StringLiteralEquality`, `MissingSwitchDefault`, `FallThrough`, `EmptyCatchBlock`(`ignored|expected`만 허용), `IllegalCatch`(`Throwable`, `Error` 금지), `OneTopLevelClass`, `OuterTypeFilename`.

### Checkstyle · SpotBugs 예외 기준

- **Checkstyle (`suppressions.xml`)**:
  - `src/test/` 아래 테스트 메서드는 한국어 검증 문장을 허용합니다(`MethodName|ConstantName` 제외).
  - Flyway Java 마이그레이션 클래스(`V<번호>__<설명>`)는 `TypeName` 검사를 제외합니다.
- **SpotBugs (`exclude.xml`)**:
  - `EI_EXPOSE_REP2`(생성자로 받은 협력자 보관)는 Spring 생성자 주입 패턴이므로 전역 제외합니다.
  - `EI_EXPOSE_REP`(접근자로 내부 가변 컬렉션 노출)은 제외하지 않고, `record` 생성자에서 방어 복사로 해소합니다.
  - 테스트 클래스(`*Test`)에서만 의도적 널 입력 검증(`NP_NONNULL_PARAM_VIOLATION`)과 예외 단언 람다(`RV_RETURN_VALUE_IGNORED_INFERRED`)를 제외합니다.

## Lombok 규칙 (`lombok.config`)

프로젝트 루트에 `lombok.config`를 두어 아래 네 가지를 고정합니다.

```properties
config.stopBubbling = true
lombok.accessors.fluent = true
lombok.addLombokGeneratedAnnotation = true
lombok.setter.flagUsage = error
```

- `fluent = true`: `getXxx()` 대신 `record`와 동일하게 필드명 그대로 접근자(`user.name()`, `errorCode.status()`)를 생성합니다.
- `setter.flagUsage = error`: `@Setter` 사용 시 컴파일 단계에서 즉시 실패시킵니다.
- `addLombokGeneratedAnnotation = true`: 생성 메서드에 `@lombok.Generated`를 붙여 정적 분석과 커버리지 노이즈를 막습니다.
- 의존성 주입은 `@RequiredArgsConstructor`와 `private final` 필드 조합을 사용합니다.

## Java `record`와 접근 제어

- 요청·응답 DTO(`*Requests`, `*Views`)와 공개 값 타입은 `record`로 작성합니다.
- `record`의 컬렉션 컴포넌트는 compact constructor에서 `List.copyOf`·`Set.copyOf`로 방어 복사해 불변성을 보장합니다.

```java
public record NotificationSlice(List<NotificationItem> items, String nextCursor) {
    public NotificationSlice {
        items = List.copyOf(items);
    }
}
```

- `infrastructure`의 `@Repository` 구현체와 컨텍스트 내부 전용 보조 클래스는 불필요한 `public`을 붙이지 않고 패키지 전용(package-private)으로 둡니다.
