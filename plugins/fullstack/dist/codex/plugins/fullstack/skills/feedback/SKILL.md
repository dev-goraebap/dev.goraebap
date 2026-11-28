---
name: feedback
description: "다른 프로젝트에서 fullstack 플러그인을 쓰다 발견한 지침 오류·빈틈·디자인 불만·더 나은 패턴을 작업 흐름을 끊지 않고 dev.goraebap 이슈로 즉시 남기거나(기본), 현재 프로젝트의 AGENTS.md·docs 규칙 중 범용 승격 후보를 수확(harvest)할 때 사용합니다."
---

# Fullstack 피드백 · 규칙 수확 (`fullstack:feedback`)

현재 프로젝트 작업을 멈추거나 `dev.goraebap` 저장소로 이동하지 않고, 지침·디자인 시스템 개선 신호만 빠르게 원격 수집함(`dev-goraebap/dev.goraebap` GitHub Issues)으로 전달합니다.

## 기본 원칙

1. **흐름 최우선**: 원본 저장소 클론·브랜치·PR을 만들지 않습니다. `gh issue create` 한 번으로 신호만 남기고 즉시 원래 작업으로 돌아옵니다.
2. **기밀 제거**: 특정 회사·제품명·업무 데이터·사내 주소·접속 정보는 반드시 일반화하거나 마스킹한 뒤 이슈 본문에 적습니다.
3. **공통/스택 구분 명시**: 문제가 모든 스택에 해당하는 공통 기준인지, 특정 스택 구현인지, 디자인 시스템인지 표시합니다.

## 라벨 분류

| 상황 | 라벨 |
| --- | --- |
| 지침이 틀렸거나 빌드·런타임·API와 충돌함 | `inbox:bug` |
| 지침이 다루지 않는 빈틈이라 즉석에서 결정해야 함 | `inbox:gap` |
| 디자인 시스템 컴포넌트·레이아웃·UX 체감이 아쉽거나 개선안이 있음 | `inbox:design` |
| 현재 프로젝트 `AGENTS.md`·`docs/` 규칙을 플러그인 기준에 승격하고 싶음 | `inbox:harvest` |
| 기존 기준보다 더 나은 패턴·네이밍·최신 방식이 보임 | `inbox:upgrade` |

## 모드 1: 즉시 피드백 투척 (기본)

사용자가 작업 중 문제·불만·아이디어를 전달하면 별도 긴 인터뷰 없이 현재 대화 맥락에서 정보를 정리해 바로 등록합니다.

1. 현재 맥락에서 **관련 스킬·문서 경로**, **겪은 문제 또는 제안**, **일반화된 최소 예시**, **적합한 `inbox:*` 라벨**을 정합니다.
2. 아래 명령으로 `dev-goraebap/dev.goraebap`에 이슈를 생성합니다.

```bash
gh issue create -R dev-goraebap/dev.goraebap \
  --label "inbox:<bug|gap|design|upgrade>" \
  --title "[<영역>] 한 줄 요약" \
  --body "$(cat <<'EOF'
## 관련 스킬 · 문서
- 스킬: `<goraebap-mode | frontend-engineering | frontend-uiux | backend-engineering>`
- 추정 경로: `<예: frontend/reference/routing/index.md>`
- 영향 범위: `<공통 기준 | 스택 구현 | 디자인 시스템>`

## 발견한 문제 / 제안
<실제 작업 중 겪은 마찰이나 더 나은 방식을 2~4줄로 정리>

## 일반화된 맥락 · 재현 스니펫
<사내 정보·특정 제품명을 제거한 최소 코드 또는 상황 설명>

## 기대하는 반영 방향
<문서 보완 / 규칙 수정 / 디자인 시스템 검토 등>
EOF
)"
```

3. 생성된 이슈 URL만 한 줄로 알리고 원래 작업으로 복귀합니다.

## 모드 2: 프로젝트 규칙 수확 (`harvest`)

사용자가 `harvest` 또는 "프로젝트 규칙 중 플러그인에 올릴 만한 것 추려줘"를 요청할 때 실행합니다.

1. 현재 저장소의 `AGENTS.md`, `docs/`(가이드·ADR·컨벤션)와 디자인 시스템 오버라이드 파일을 읽습니다.
2. 설치된 `fullstack` 플러그인 기준과 비교해 **특정 프로젝트 전용 규칙을 제외하고**, 다른 프로젝트에서도 반복해서 유용할 **범용 후보 최대 5건**만 추립니다.
3. 후보 목록(제목 · 추천 라벨 `inbox:harvest` · 핵심 내용 1줄)을 사용자에게 먼저 보여 주고, 사용자가 고른 항목만 `gh issue create -R dev-goraebap/dev.goraebap --label "inbox:harvest"`로 등록합니다.
4. 등록된 이슈 URL 목록을 알리고 마무리합니다.
