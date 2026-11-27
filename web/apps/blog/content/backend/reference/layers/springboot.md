---
title: 레이어 (Spring Boot)
summary: 공통 레이어 규칙을 Spring Boot 코드에 매핑하는 기준입니다.
---

## 계층별 Spring Boot 구성

| 계층 | 구성 요소 | 구현 규칙 |
| --- | --- | --- |
| 컨텍스트 루트 | `*Facade`, 공개 `record`·`enum` | 인터페이스와 불변 값 타입만 둡니다. 구현체는 `application`에 둡니다. |
| `application` | `*Controller` | `@RestController`, `@Valid`, `@AuthenticationPrincipal`로 입력을 받아 `*Service`에 위임합니다. |
| `application` | `*Service` | `@Service`, 트랜잭션 경계(`@Transactional`). 공개 계약이 있으면 루트의 `*Facade`를 `implements`합니다. |
| `application` | `*Query` | 읽기 전용 조회 포트 인터페이스입니다. |
| `application` | `*Requests`, `*Views` | 요청·응답 DTO 묶음(`record` 기반). |
| `application` | `*ErrorCode` | `shared.error.ErrorCode`를 구현하는 컨텍스트 전용 `enum`입니다. |
| `domain` | `<Entity>`, `<ValueObject>`, `*Repository` | 순수 Java 클래스·`record`·인터페이스만 둡니다. Spring·jOOQ 어노테이션과 타입을 쓰지 않습니다. |
| `infrastructure` | `Jooq*Repository`, `Jooq*Query`, `*Config` | `@Repository`, `@Component`, `@Configuration`으로 포트 구현체와 프레임워크 설정을 등록합니다. |

## 트랜잭션 경계 규칙

- 쓰기 유스케이스 메서드에는 `@Transactional`을 붙입니다.
- 읽기 전용 유스케이스 메서드에는 `@Transactional(readOnly = true)`를 붙입니다.
- 다른 컨텍스트의 쓰기 트랜잭션 안에서만 호출되어야 하는 공개 계약(`*Facade`) 구현 메서드에는 `@Transactional(propagation = Propagation.MANDATORY)`를 사용해 호출자 트랜잭션 합류를 강제합니다.
- Controller와 `infrastructure` 구현체에는 트랜잭션 경계를 두지 않습니다.

## `application` 피처 분리와 루트 공통 배치

한 컨텍스트에 Controller · Service 조합이 여러 개로 늘어나면 `application/` 아래를 피처 단위로 나누고, 여러 피처가 공통으로 참조하는 요소는 `application/` 루트에 둡니다.

```text
<context>/
  *Facade.java              # 컨텍스트 공개 계약
  application/
    AuthErrorCode.java      # 하위 피처들이 공통으로 쓰는 에러 코드·설정·포트
    AuthSettings.java
    auth/                   # 피처 1
      AuthController.java
      AuthService.java
      AuthRequests.java
      AuthViews.java
    profile/                # 피처 2
      ProfileController.java
      ProfileService.java
  domain/
    user/                   # 애그리거트 1
    session/                # 애그리거트 2
  infrastructure/
```

피처 단위로 하위 패키지를 나누더라도 같은 컨텍스트 안의 Service끼리 직접 참조하지 않고 `domain/`의 애그리거트와 포트를 조합하는 규칙은 동일하게 유지합니다.
