# dev-goraebap

여러 프로젝트를 진행하며 정리한 아키텍처·구조·코딩 스타일·UI/UX 개발 기준을 에이전트 플러그인으로 관리하는 개인 개발 하네스이자 마켓플레이스(`dev-goraebap`)입니다.

프로젝트마다 스킬과 지침을 새로 만들거나 복사해 두지 않고, 이 저장소에서 분야별 플러그인을 한곳에서 관리합니다. 각 프로젝트는 `AGENTS.md`로 필요한 플러그인을 가리켜 일관된 개발 방식을 따릅니다.

## 설계 방식

- **핵심 지침(`skills/`)과 어댑터(`adapters/`) 분리**: 핵심 지침은 특정 기술 스택이나 라이브러리에 묶이지 않는 판단 기준과 원칙만 담습니다. 기술 스택이 바뀌어도 핵심 지침은 크게 흔들리지 않습니다.
- **오픈소스 프로젝트 어댑터**: 완성도가 확인된 공개 오픈소스 프로젝트를 스택 조합별 어댑터로 등록해, 핵심 지침을 해당 스택에서 어떻게 구현하는지 고정 커밋 스냅샷으로 보여 줍니다. 어댑터가 없는 새 스택은 핵심 지침만으로 작업하고, 완성도가 올라오면 새 어댑터로 추가합니다.
- **분야별 플러그인 확장**: 플랫폼이나 분야가 다르면 `plugins/` 아래에 별도 플러그인으로 관리합니다.

## 플러그인 목록

| 플러그인 | 식별자 | 다루는 범위 | 등록된 어댑터 | 안내 |
| --- | --- | --- | --- | --- |
| **Webapp** | `webapp@dev-goraebap` | 웹 앱 개발 절차, 아키텍처, API, DB, 백엔드, 프론트엔드, UI/UX | [cowork](https://github.com/dev-goraebap/cowork) (React · Spring Boot · shadcn) | [사용 안내](plugins/webapp/docs/plugin-usage.md) · [개발 안내](plugins/webapp/README.md) |

## 설치

에이전트에게 부탁할 때는 이렇게 말합니다.

> dev-goraebap 마켓플레이스(https://github.com/dev-goraebap/dev.goraebap)에서 `webapp@dev-goraebap` 플러그인을 설치해 줘.

Claude Code에서는 마켓플레이스를 등록한 뒤 필요한 플러그인을 설치합니다.

```text
/plugin marketplace add dev-goraebap/dev.goraebap --scope user
/plugin install webapp@dev-goraebap --scope user
```

Codex에서는 다음을 실행합니다.

```text
codex plugin marketplace add https://github.com/dev-goraebap/dev.goraebap.git --ref main
codex plugin add webapp@dev-goraebap
```

Antigravity에서는 패키징된 플러그인 폴더(`plugins/webapp/dist/antigravity/plugins/webapp`)를 사용자 플러그인 경로(`~/.gemini/config/plugins/webapp`)에 복사하거나 연결하면 자동으로 불러옵니다.

## 업데이트

Claude Code에서는 마켓플레이스와 플러그인을 갱신한 뒤 `/reload-plugins`를 입력하거나 새 세션을 엽니다.

```text
claude plugin marketplace update dev-goraebap
claude plugin update webapp@dev-goraebap
```

Codex에서는 다음을 실행합니다.

```text
codex plugin marketplace upgrade dev-goraebap
```

Antigravity에서는 저장소를 최신으로 받은 뒤 `plugins/webapp/dist/antigravity/plugins/webapp`을 `~/.gemini/config/plugins/webapp`에 다시 반영합니다(심링크·정션으로 연결해 두면 `git pull`만으로 갱신됩니다).
