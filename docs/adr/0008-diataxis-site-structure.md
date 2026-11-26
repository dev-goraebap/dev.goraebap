# 사이트는 공간 없이 Diátaxis 갈래를 헤더 메뉴로 나눈다

사이트에서 공간(frontend·backend·playbook)을 없애고, 헤더 메뉴를 **Playbooks · Blog · Reference · Design System** 넷으로 둡니다. 주소의 첫 마디도 이 메뉴입니다(`/playbooks/…`, `/blog/…`, `/reference/frontend/<묶음>/<문서>/<스택>`, `/reference/backend/<묶음>/<문서>/<스택>`, `/design-system/…`). 메뉴마다 Diátaxis(diataxis.fr)의 한 갈래를 맡고, 갈래마다 글 쓰는 방식이 다릅니다.

- **Playbooks**: how-to. 이미 할 줄 아는 사람이 자기 프로젝트에서 좁은 목표 하나를 이루는 글이고, 제목도 그 목표로 씁니다(예: "프론트엔드 프로젝트 세팅하기"). 프론트엔드와 백엔드를 따로 세팅할 수 있게 씁니다.
- **Blog**: explanation. 의견, 이유, 대안 비교, 리서치를 씁니다.
- **Reference**: 구현 기준. Frontend는 구조 · 라우팅 · 상태 관리 · 렌더링 · 코드 규칙, Backend는 구조 · API · 데이터 · 보안 · 코드 규칙으로 나눕니다. 규칙마다 이유는 한 구절까지만 쓰고, 길어지면 Blog로 옮겨 링크합니다.
- **Design System**: 내 디자인 시스템이라는 별도 제품의 문서입니다. 안에서도 설명과 참조를 섞지 않습니다.

글 사이의 링크는 Playbooks → Reference·Blog, Blog → Reference, Reference → Blog(배경 한 줄), Reference ↔ Design System 방향으로 겁니다. 어느 메뉴에 둘지는 "코드가 어디서 무엇을 하나 → Reference, 화면이 어떻게 보이고 반응하나 → Design System, 왜 그렇게 하나 → Blog"로 정합니다. 그래서 옛 Interaction 문서는 이 기준으로 Reference와 Design System에 나눠 넣습니다. 스킬 goraebap-webapp에는 Reference와 Design System의 참조 부분만 들어갑니다(ADR 0002 유지). 이 결정은 ADR 0007(arc42 주제 이름)을 대신하고, ADR 0005의 경로 모양(`references/<영역>/<메뉴>/…`)을 새 주소에 맞춘 모양으로 바꿉니다.

도입은 Diátaxis가 권하는 대로 점진적으로 합니다. 주소를 두 번 옮기지 않도록 메뉴와 주소 틀은 한 번에 바꾸지만, 글은 한 편씩 새 형식으로 고쳐 바로 배포합니다. 글이 없는 메뉴나 "준비 중" 항목은 걸어 두지 않습니다. Tutorials(예제 앱을 따라 만드는 레슨)는 필요해질 때 만듭니다.

## 검토한 안

- **arc42 절을 목차로**: 시스템 하나를 기록하는 틀이라 도메인 없는 규칙 모음에서는 1·3·7·10·11절이 늘 비어 있습니다.
- **공간(frontend·backend·fullstack)마다 같은 메뉴**: 같은 시스템이 여러 공간으로 흩어지고, 공간마다 스택 선택기와 메뉴가 갈립니다.
- **Playbooks를 튜토리얼로**: 스택 고르기·도메인 분석처럼 선택과 판단이 들어가는 글은 튜토리얼(선택지 없는 레슨)이 될 수 없습니다.
- **전면 개편 후 한 번에 내놓기**: Diátaxis가 가장 말리는 방식이고, 끝날 때까지 배포할 수 없습니다.
- **Playbooks·Blog도 스킬에 넣기**: 스킬이 구현 기준을 넘어 절차와 의견까지 담아 맥락을 많이 차지하고, 엉뚱한 때 꺼내질 수 있습니다.
