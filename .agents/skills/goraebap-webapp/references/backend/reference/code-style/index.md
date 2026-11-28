# 코드 스타일과 네이밍

## 역할별 네이밍 규칙

| 영역 | 구성 요소 | 네이밍 규칙 | 예시 |
| - | - | - | - |
| 공개 계약 | 컨텍스트 진입 인터페이스 | `*Facade` | `UserFacade`, `FileFacade` |
| 공개 계약 | 확장 포인트 인터페이스 | `*Spi` | `SearchSpi`, `SeedFormatSpi` |
| 공개 계약 | 공개 값 타입·열거형 | 접미사 없이 업무 명사 | `UserSummary`, `AttachedFile` |
| `application` | HTTP 진입점 | `*Controller` | `FileController`, `RoleController` |
| `application` | 유스케이스 조율 | `*Service` | `FileService`, `NotificationService` |
| `application` | 읽기 전용 조회 포트 | `*Query` | `FileQuery`, `NotificationQuery` |
| `application` | 요청·응답 DTO 묶음 | `*Requests`, `*Views` | `FileRequests`, `FileViews` |
| `application` | 컨텍스트 전용 에러 코드 | `*ErrorCode` | `FileErrorCode`, `AuthErrorCode` |
| `application` | 정기 작업·에이전트 진입점 | `*Scheduler`, `*McpTools` | `UploadCleanupScheduler`, `FileMcpTools` |
| `domain` | 엔티티·값 객체 | 접미사(`Entity`, `Model`) 없이 업무 명사 | `Attachment`, `PendingUpload`, `ImageTraits` |
| `domain` | 영속성 포트 인터페이스 | `*Repository` (애그리거트 루트 단위) | `AttachmentRepository`, `UserRepository` |
| `infrastructure` | 기술 구현체 | 기술 접두사 + 포트 이름 | `JooqAttachmentRepository`, `S3ObjectStorage` |
| `infrastructure` | 프레임워크·외부 연동 설정 | `*Config` | `PersistenceConfig`, `StorageConfig` |

- 도메인 모델 이름에 `Entity`, `Vo`, `Dto` 같은 기술 접미사를 붙이지 않고 업무 낱말 그대로 씁니다.
- 구현체에는 실제 기술 이름을 접두사로 붙여 인터페이스와 구현체를 한눈에 구분합니다.

## 불변성과 상태 변경

- 필드를 무분별하게 여는 범용 `setter`를 금지합니다. 상태 변경은 의도가 드러나는 도메인 메서드(예: `bind`, `expire`, `rename`)로 수행하며, 불변식 검증을 그 메서드 안에 둡니다.
- 요청·응답 DTO와 값 객체는 불변 타입으로 작성합니다. 컬렉션 필드는 생성 시점에 불변 컬렉션으로 방어 복사해 외부에서 변경하지 못하게 합니다.
- 의존성 주입은 생성자 주입만 사용합니다. 필드 주입은 금지합니다.

## import와 제어 흐름 위생

- 와일드카드(`*`) import, 중복 import, 미사용 import를 금지합니다.
- 빈 `catch` 블록이나 최상위 오류(`Throwable`, `Error`)를 통째로 삼키는 코드를 금지합니다. 예외를 의도적으로 무시해야 하는 드문 경우에만 `ignored` 같은 명시적 변수명과 주석을 남깁니다.
- `switch` 분기에는 누락된 케이스(`default` 또는 exhaustiveness 검사)를 처리하고 의도치 않은 fall-through를 금지합니다.
- 불필요한 불리언 비교(`== true`)와 중복 `if/else` 반환을 단순화합니다.

## 코드 품질 도구와 예외 처리 원칙

- **역할 분리**: 포맷터(들여쓰기·줄바꿈·import 정리), 컨벤션 린터(명명·결함 유발 패턴), 정적 결함 분석기는 같은 항목을 겹쳐 검사하지 않게 역할을 나눕니다.
- **무경고 원칙**: 린트·컨벤션 검사의 경고 허용치는 `0`으로 유지합니다.
- **생성 코드 제외**: 스키마나 API 명세에서 자동 생성된 코드는 모든 코드 품질 검사 대상에서 제외합니다.
- **예외 사유 기록**: 정적 분석이나 린트 규칙을 개별 제외(suppression)할 때는 설정 파일에 사유를 주석으로 남깁니다.
- **테스트 명명**: 프로덕션 코드는 영문 식별자를 따르되, 테스트 메서드 이름은 검증 대상을 바로 읽을 수 있도록 한국어 문장을 허용합니다.

스택별 구현: [springboot.md](springboot.md)
