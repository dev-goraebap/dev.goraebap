---
arc42: "8.8"
---

# 기본 레퍼런스의 사용과 갱신

프로젝트 디자인·기존 부품·사용자가 준 참고 화면이 있으면 그것을 우선합니다. 지정이 없을 때 [키트](https://github.com/dev-goraebap/dev.goraebap/blob/main/apps/site/src/shared/ui/README.md)를 출발점으로 씁니다. 키트는 shadcn 레지스트리 `webcraft`(`https://goraebap.xyz/r/<이름>.json`)로 배포하며, 선택해서 받는 설계와 코드이지 제품 전체를 자동 생성하는 템플릿이 아닙니다.

## 선택해서 채택

1. 현재 UI와 디자인 기록을 읽고 다른 결정이 있는지 확인합니다. 프로젝트가 이미 가진 Page·필터·설정을 다시 만들지 않습니다.
2. [패턴 카탈로그](pattern-catalog.md)에서 필요한 지침·코드·견본을 읽습니다. 받을 레지스트리 항목과 필요한 슬롯·반응형 조건을 확인합니다.
3. 프로젝트 `components.json`에 `"registries": { "@webcraft": "https://goraebap.xyz/r/{name}.json" }`을 두고, 실제로 쓸 항목만 `npx shadcn@latest add @webcraft/<이름>`으로 받습니다. 레지스트리 파일은 Webcraft FSD 별칭을 그대로 import하며 shadcn이 다른 별칭으로 바꿔 주지 않습니다. 그래서 `components.json`의 aliases를 `ui: "@/shared/ui"`, `lib: "@/shared/lib"`로, tsconfig의 `@/*`를 `src/*`로 둡니다. `cn`은 `cn` 패키지에서 가져옵니다(`utils: "cn"`). FSD는 `utils`처럼 역할로 지은 파일을 두지 않으므로 `shared/lib/utils.ts`를 만들지 않습니다. 스킬 설치·동기화는 제품 코드를 복사하거나 import를 넣지 않습니다.
4. 토큰과 기본 CSS는 `@webcraft/theme` 항목으로 받습니다. 빈 상태 그림(webp 12개)은 레지스트리 JSON에 담을 수 없어 `https://goraebap.xyz/r/assets/page-state/landscapes/`에서 따로 받습니다(`page-state` 항목의 설치 안내에 명령이 있습니다). 키트 부품은 `render={<Link … />}`나 `RowLink`로 라우터에 이어지므로 루트에 링크 Provider를 두지 않습니다. 라우터·세션·API·메뉴·아이콘 매핑·저장 계약은 프로젝트 소유자가 연결합니다.
5. 프로젝트의 테마·모바일 탐색·오버레이를 연결한 뒤 실제 화면에서 확인합니다. 타입 검사만으로 시각적 재현을 보장하지 않습니다.

받은 코드는 shadcn 방식대로 그 프로젝트 소유입니다. 버전 확인을 위해 사용자의 프로젝트에 관리 메타데이터를 강제로 추가하지 않습니다.

## 지속적인 개선

새 경험을 얻으면 증상 → 바뀐 기준 → 영향받는 패턴 → 확인 결과를 근거로 지침과 키트를 함께 고칩니다. 한 프로젝트의 우연한 구현이나 결함을 공통 규칙으로 올리지 않습니다. 화면마다 다르면 목적의 차이인지 일관성 부족인지 먼저 판단합니다. 출처·비교·추출 메모는 Git에서 제외한 개발 자료로 관리하고 배포 지침이 그 파일을 읽게 하지 않습니다.

기본값이나 부품 계약을 바꾸면 레지스트리 항목을 함께 고치고 검증 범위를 표시합니다. 이미 채택한 프로젝트 코드는 그 프로젝트가 소유하며 공통 변경을 자동 적용하지 않습니다. 갱신은 `npx shadcn@latest add @webcraft/<이름> --diff`로 비교한 뒤 프로젝트가 고릅니다. 프로젝트의 별도 디자인 선택은 공통 지침의 결함으로 취급하지 않습니다.
