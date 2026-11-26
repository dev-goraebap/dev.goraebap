# 파생값과 부수 효과 (react)

공통 규칙은 [index.md](index.md)에 있습니다.

## effects

파생값은 렌더 중에 바로 계산하고, `useEffect`는 외부 구독과 동기화에만 쓰며 정리 함수로 해제합니다. `useMemo`·`useCallback`은 측정된 비용이나 참조 안정성이 필요한 경계에만 씁니다. Strict Mode의 이중 실행에서 드러난 문제는 `useRef` 플래그로 막지 않고 정리 함수를 고칩니다.
