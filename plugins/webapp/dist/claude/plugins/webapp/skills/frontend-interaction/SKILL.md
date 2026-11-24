---
disable-model-invocation: true
name: frontend-interaction
description: 웹 앱의 움직임과 동작 줄이기, 대기·빈 상태·실패와 화면 전환, 목록 위 대화상자(라우트 마스킹), 표면 고르기·누르는 대상·키보드 동작을 구현합니다. 로딩·전환·상태 화면·상호작용을 만들거나 고칠 때 사용합니다.
arc42: "8.5, 2"
---

# 인터랙션

화면이 사용자 입력과 데이터 대기에 어떻게 반응하고 움직이는지를 다룹니다. 모양과 컴포넌트 조합은 [디자인 시스템](../frontend-design-system/SKILL.md), 라우트 데이터 준비·URL·상태 소유는 [프론트엔드 엔지니어링](../frontend-engineering/SKILL.md)이 맡습니다. 같은 규칙을 두 곳에 복제하지 않고 연결합니다.

## 어댑터

이 지침은 판단 기준만 담고 구현은 담지 않습니다. 프로젝트 AGENTS.md의 `Webapp 어댑터:` 줄이 가리키는 어댑터에서 같은 이름의 파일(`frontend-interaction.md`)을 함께 읽습니다. 어댑터 목록과 고르는 법은 [어댑터](../../adapters/README.md)에 있습니다. 어댑터와 프로젝트 AGENTS.md가 다르면 AGENTS.md를 따릅니다.

## 읽을 자료

| 작업 | 읽을 자료 |
| --- | --- |
| 움직임·동작 줄이기 | [모션](references/motion.md) |
| 대기·빈 상태·실패·전환 | [데이터 상태](references/data-states.md) |
| 목록 위 대화상자와 주소 | [라우트 마스킹](references/route-masking.md) |
| 표면 고르기·누르는 대상·키보드 | [입력과 상호작용](references/interaction-patterns.md) |

완료 시 바뀐 화면의 데스크톱·휴대폰에서 대기·실패·빈 상태, 뒤로가기·새로고침, 포커스·키보드, 동작 줄이기 설정을 확인합니다.
