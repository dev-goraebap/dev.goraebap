---
title: 레이어
summary: 컨텍스트 내부를 구성하는 계층별 책임, 호출 방향, 금지 규칙입니다.
order: 2
icon: transition
---

이 구조를 선택한 설계 배경은 [컨텍스트와 레이어 설계](../../articles/context-and-layers.md)를 참고합니다.

## 계층 구성과 책임

컨텍스트 루트(공개 계약) 아래에 세 개의 내부 계층을 둡니다.

| 위치 | 역할 | 주요 구성 요소 |
| --- | --- | --- |
| 컨텍스트 루트 | 다른 컨텍스트에 노출하는 공개 계약 | `*Facade` 인터페이스, 공개 DTO·Enum, 확장 SPI |
| `application` | 외부 진입과 유스케이스 조율, 트랜잭션 경계 | Controller, Service, 읽기 전용 Query 포트, 요청·응답 DTO, 컨텍스트 전용 에러 코드 |
| `domain` | 순수 비즈니스 규칙과 상태 모델, 영속성 포트 | 애그리거트(Entity, Value Object, 도메인 정책), `*Repository` 인터페이스 |
| `infrastructure` | 포트의 실제 기술 구현과 외부 연동 | Repository·Query 구현체, 외부 API 어댑터, 보안·인프라 설정 |

## 호출과 의존 규칙

```text
외부 요청 ─▶ application (Controller ─▶ Service) ─▶ domain (Entity / Repository 포트)
                                            │                    ▲
                                            ├─▶ application (Query 포트) ──┐
                                            └─▶ 다른 컨텍스트의 공개 계약    │ (구현)
                                                                  infrastructure
```

### 진입과 유스케이스 (`application`)

- HTTP 진입점(Controller)과 유스케이스(Service)는 같은 `application` 계층에 둡니다.
- Controller는 요청 바인딩·입력 검증·인증 주체 전달만 맡고, 비즈니스 흐름은 Service에 위임합니다.
- 상태 변경(쓰기)은 반드시 `Controller → Service → Domain / Repository` 흐름을 따르며, Controller가 Repository를 직접 호출하지 않습니다.
- 같은 컨텍스트 안의 Service끼리는 서로 직접 참조하지 않고, 각 Service가 필요한 `domain` 애그리거트(Repository)와 포트를 조합해 사용합니다.
- 여러 Service에서 반복되는 도메인 계산·판단 규칙은 Service 간 호출로 풀지 않고 `domain`의 순수 도메인 서비스나 모델 메서드로 내립니다.
- 다른 컨텍스트와 통신할 때는 상대 컨텍스트의 공개 계약(`*Facade` 등)만 호출합니다.

### 도메인 모델과 애그리거트 (`domain`)

- `domain` 계층은 `application`, `infrastructure`, 웹·DB·DI 프레임워크에 의존하지 않습니다.
- 하나의 컨텍스트 안에 생명주기가 다른 여러 애그리거트가 존재할 수 있으며, `domain/` 아래에 애그리거트 단위로 하위 폴더를 나눕니다.
- `*Repository` 인터페이스는 엔티티마다 기계적으로 만들지 않고, 원칙적으로 **애그리거트 루트 단위**로 둡니다.
- 화면 목록·검색·집계처럼 도메인 상태 변경이 없는 읽기는 애그리거트 Repository 대신 `application`의 `*Query` 포트로 분리합니다.

### 기술 구현 (`infrastructure`)

- `domain`의 `*Repository`와 `application`의 `*Query` 및 외부 어댑터 포트를 구현합니다.
- 비즈니스 규칙 판정은 `infrastructure`에 두지 않습니다.

## 규모에 따른 내부 분할 규칙

컨텍스트와 각 계층은 **“루트 = 하위에서 공통으로 참조하는 것, 하위 폴더 = 관심사별 분리”**라는 같은 원리를 따릅니다.

- **단순 컨텍스트**: 도메인 규칙이 없는 단순 CRUD나 조회 전용 컨텍스트라도 공개/비공개 경계를 유지하기 위해 내부 코드는 `application/` 아래에 둡니다. 필요 없는 `domain/`이나 `infrastructure/`는 생략할 수 있습니다.
- **`application/` 분할 (피처 관점)**: 기능이 하나뿐이면 `application/` 바로 아래에 평평하게 둡니다. Controller · Service 조합이 여러 개로 늘어나면 **피처(`<feature>/`)** 단위로 하위 폴더를 나누고, 여러 피처가 공통으로 참조하는 요소(공통 에러 코드, 설정, 외부 발송 포트 등)는 `application/` 루트에 둡니다.
- **`domain/` 분할 (애그리거트 관점)**: 애그리거트가 하나뿐이면 `domain/` 바로 아래에 평평하게 둡니다. 여럿으로 늘어나면 **애그리거트(`<aggregate>/`)** 단위로 하위 폴더를 나누고, 여러 애그리거트가 공통으로 쓰는 값 객체·정책은 `domain/` 루트에 둡니다.
