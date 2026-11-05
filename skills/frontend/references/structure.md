# 구조와 코드

- 새 동작은 처음 쓰는 `pages/<페이지>/{ui,model,api}`에 둔다. 독립적인 두 화면이 실제로 공유할 때 사용자 행동은 features, 도메인 모델·조회는 entities로 추출한다. 라우트 loader가 호출한다는 이유만으로 공용화하지 않는다.
- `app → pages → widgets → features → entities → shared` 방향으로 참조한다. 같은 레이어의 다른 슬라이스를 직접 참조하지 않고, 슬라이스 밖에서는 공개 index를 쓴다. app·shared는 역할별 세그먼트로 나눈다.
- widgets는 셸·복합 패널 같은 독립 UI 블록에 쓴다. 막연한 재사용이나 파일 길이만으로 계층을 늘리지 않는다.
- 컴포넌트는 PascalCase 파일 하나에 하나씩, 페이지에는 Page 접미사를 쓴다. 훅은 use로 시작하고 일반 유틸·설정 파일은 kebab-case다.
- 파생값을 state에 복사해 Effect로 맞추지 않는다. 사용자 명령은 이벤트 핸들러·mutation이 처리하고, Effect는 외부 구독과 동기화에 쓰며 해제한다.
- useMemo·useCallback은 측정된 비용 또는 참조 안정성이 필요한 경계에 쓴다. StrictMode에서 드러난 수명주기 문제를 실행 방지 플래그로 숨기지 않는다.
- 그룹·별칭·lint 설정은 프로젝트에서 확인한다. 다른 프로젝트의 페이지 그룹이나 도우미 함수가 있다고 가정하지 않는다.
