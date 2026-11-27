# 백엔드 용어집

## 구조와 경계

### 도메인 (Domain)

- **id**: `domain`
- **정의**: 소프트웨어가 해결하려는 사업 영역·문제 공간 전체(프로젝트·서비스 그 자체)입니다.
- **구분**: 컨텍스트 내부의 순수 규칙 패키지인 `도메인 계층`과 구분해 사용합니다.

### 하위 도메인 (Subdomain)

- **id**: `subdomain`
- **정의**: 코드를 작성하기 전부터 현실 비즈니스에 존재하는 개별 문제 영역입니다(예: 회원, 주문, 결제, 파일). 개발자가 만드는 대상이 아니라 업무에서 발견하는 단위입니다.
- **구분**: 현실 세계의 문제 단위인 `하위 도메인`을 소프트웨어 경계로 설계해 옮긴 것이 `컨텍스트`입니다.

### 컨텍스트 (Context)

- **id**: `context`
- **정의**: 하위 도메인을 해결하기 위해 설계한 독립된 소프트웨어 경계(바운디드 컨텍스트)입니다. 같은 용어와 모델이 일관되게 통하는 울타리이며, 내부 구현을 숨기고 공개 계약으로만 외부와 통신합니다.
- **구분**: 현실의 문제 단위인 `하위 도메인`과 구분하며, NestJS의 `@Module()`(DI 묶음 단위)이나 Gradle 멀티모듈(빌드 단위)과 섞어 쓰지 않습니다.
- **스택 매핑**:
  - Spring Boot: 컨텍스트 패키지 + `ArchitectureTest`로 내부 계층 import 차단
  - NestJS: 컨텍스트 폴더 + `@Module({ exports })`로 공개 계약만 외부에 노출

### 애그리거트 (Aggregate)

- **id**: `aggregate`
- **정의**: 하나의 트랜잭션 안에서 함께 일관성(비즈니스 규칙)이 지켜져야 하는 도메인 객체들의 변경 경계입니다. 외부에서는 애그리거트 루트(Aggregate Root)를 통해서만 상태를 변경하며, 영속성 저장소(`*Repository`)는 원칙적으로 애그리거트 루트 단위로 둡니다.
- **구분**: 하나의 `컨텍스트` 안에는 서로 다른 생명주기를 가진 여러 `애그리거트`가 함께 존재할 수 있습니다(예: 게시물 컨텍스트 안의 `Post`, `Category`, `Tag`).

### 피처 (Feature)

- **id**: `feature`
- **정의**: `application` 계층 안에 Controller · Service · Query · DTO 조합이 여러 개로 늘어났을 때, 기능 관점으로 묶어 나누는 하위 패키지 단위입니다(예: `auth`, `avatar`, `role`, `post`, `tag`).
- **구분**: 엄밀한 학술·표준 용어가 아니라 이 문서에서 편의를 위해 부르는 이름이며, Vertical Slice Architecture나 FSD(Feature-Sliced Design)의 슬라이스(Slice)와 비슷한 개념으로 이해하면 됩니다. `domain` 계층을 나누는 `애그리거트`와 짝을 이루는 분할 단위입니다.

### 경량 CQRS (Command Query Responsibility Segregation)

- **id**: `cqrs`
- **정의**: 같은 데이터베이스를 공유하면서 상태를 바꾸는 명령(쓰기) 경로와 데이터를 읽는 조회(읽기) 경로를 코드 수준에서 분리하는 패턴입니다. 명령은 `Repository`와 도메인 모델을 거치고, 조회는 `Query` 포트와 뷰 DTO로 직접 읽습니다.
- **구분**: 읽기·쓰기 DB를 물리적으로 분리하고 이벤트로 동기화하는 분산 CQRS와 달리, 단일 DB 안에서 모델과 쿼리 책임만 나누는 단순한 형태를 가리킵니다.

### 기술 기반 (Technical Foundation)

- **id**: `shared`
- **정의**: 업무 지식이 없는 순수 기술 기반 코드 영역입니다. 공통 에러 베이스, DB·트랜잭션 설정, 스토리지 추상화, HTTP 필터와 공통 응답 형식을 두며 어떤 컨텍스트도 참조하지 않습니다.
- **구분**: 폴더 이름(`shared`, `common`, `core` 등)은 프로젝트마다 다르게 둘 수 있으며, 업무 코드와 기술 기반을 분리하는 경계 자체가 핵심입니다.

### 공개 계약 (Public Contract)

- **id**: `public-contract`
- **정의**: 한 컨텍스트가 다른 컨텍스트에 노출하는 진입 인터페이스(`*Facade`)와 공개 타입(DTO·Enum)입니다. 컨텍스트 간 통신은 상대 컨텍스트의 내부 계층을 직접 참조하지 않고 공개 계약만 거칩니다.
- **스택 매핑**:
  - Spring Boot: 컨텍스트 루트 패키지의 `*Facade` 및 공개 타입
  - NestJS: `@Module({ exports })`에 등록한 `*Facade` 및 공개 타입

## 내부 계층

### 애플리케이션 계층 (Application Layer)

- **id**: `application-layer`
- **정의**: 외부 요청을 받아 유스케이스를 조율하는 계층입니다. 진입점(Controller), 유스케이스와 트랜잭션 경계(Service), 읽기 전용 조회 포트(Query), 요청·응답 DTO, 컨텍스트 전용 에러 코드를 둡니다.
- **스택 매핑**:
  - Spring Boot: `@RestController`, `@Service`, `@Transactional`
  - NestJS: `@Controller`, `@Injectable`, 트랜잭션 매니저

### 도메인 계층 (Domain Layer)

- **id**: `domain-layer`
- **정의**: 프레임워크 없이 순수 비즈니스 규칙과 상태를 표현하는 계층입니다. Entity, Value Object, 도메인 정책, 영속성 포트 인터페이스(`*Repository`)를 두며 `application`·`infrastructure` 및 프레임워크에 의존하지 않습니다.
- **구분**: 프로젝트 전체를 뜻하는 `도메인`과 구분해 컨텍스트 내부의 순수 규칙 패키지를 가리킵니다.

### 인프라 계층 (Infrastructure Layer)

- **id**: `infrastructure-layer`
- **정의**: 도메인 계층과 애플리케이션 계층이 정의한 포트를 실제 기술(DB, 외부 API, 보안 설정 등)로 구현하는 계층입니다.
- **스택 매핑**:
  - Spring Boot: jOOQ `Repository`·`Query` 구현체, 외부 연동·보안 설정
  - NestJS: ORM `Repository` 구현체, 외부 어댑터 모듈
