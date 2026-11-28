# API 설계 (Spring Boot)

## 컨트롤러와 DTO 구성

- 컨트롤러는 `@RestController`와 `@RequestMapping("/api/v1/...")`을 사용합니다.
- 요청·응답 DTO는 불변 `record`로 작성하고, 피처 단위로 `*Requests`와 `*Views` 유틸리티 클래스 안에 묶습니다.
- 본문 입력은 `@Valid @RequestBody`, 쿼리 파라미터 객체는 `@ParameterObject @Valid @ModelAttribute`로 바인딩합니다.
- 응답 본문이 없는 변경 요청은 `@ResponseStatus(HttpStatus.NO_CONTENT)`와 `void` 반환 타입을 사용합니다.

```java
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping
    public NotificationViews.NotificationSlice mine(
            @AuthenticationPrincipal CurrentUser user,
            @ParameterObject @Valid @ModelAttribute NotificationRequests.NotificationListing listing) {
        return notificationService.mine(user, listing);
    }

    @PostMapping("/{id}/reads")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void read(@AuthenticationPrincipal CurrentUser user, @PathVariable UUID id) {
        notificationService.read(user, id);
    }
}
```

## 요청 정규화

- `record`의 compact constructor에서 공백 제거와 기본값 보정을 수행합니다.
- 목록 쿼리 파라미터는 `shared.web.ListParams`(`values`, `strings`)로 빈 항목과 중복을 제거하고 불변 리스트(`List.copyOf`)로 보관합니다.

```java
public record NotificationListing(
        @Size(max = 100) String q,
        ReadState read,
        @Size(max = 1000) String cursor,
        @Min(1) @Max(MAX_SIZE) Integer size) {
    public static final int DEFAULT_SIZE = 20;
    public static final int MAX_SIZE = 100;

    public NotificationListing {
        q = q == null || q.isBlank() ? null : q.strip();
        cursor = cursor == null || cursor.isBlank() ? null : cursor;
        size = Objects.requireNonNullElse(size, DEFAULT_SIZE);
    }
}
```

## 커서 페이징 (`Cursor` · `Keyset`)

- 커서 인코딩·검증은 `shared.web.Cursor`, jOOQ 다중 키 조건 바인딩은 `shared.web.Keyset`을 사용합니다.
- 조회 시 `size + 1`건을 읽어 다음 페이지 존재 여부를 판정하고, 초과 1건을 제외한 마지막 행으로 `Keyset.next(sort, lastRow, keys)`를 생성합니다.
- `Cursor.decode`가 정렬 불일치나 형식 오류를 감지하면 `CommonErrorCode.COMMON_INVALID_REQUEST`를 발생시킵니다.

## OpenAPI 명세 노출과 추출

- `application.properties`에서 스펙 경로와 대상 범위를 고정합니다.
  ```properties
  springdoc.api-docs.path=/api/openapi
  springdoc.paths-to-match=/api/v1/**
  ```
- `./gradlew exportOpenApi` 태스크로 최신 HTTP 계약을 `openapi.json` 파일에 내보내 클라이언트 타입 생성에 사용합니다.
