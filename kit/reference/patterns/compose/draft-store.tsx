import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type Drafts = Map<string, unknown>;
const DraftContext = createContext<{ drafts: Drafts; touch: () => void } | null>(null);

/**
 * 작성 초안이 사는 경계. 라우터보다 위(앱 루트)에 두어 대화상자 → 페이지(크게 보기), 분기점 전환, 표현 전환으로 양식이
 * 다시 마운트되어도 제목·본문·속성이 남는다. 저장 성공·버리기에서만 지운다. 새로고침까지 보존하려면 프로젝트가
 * 저장소(sessionStorage·서버 초안)를 정한다.
 */
export function DraftProvider({ children }: { children: ReactNode }) {
  const [, setVersion] = useState(0);
  const drafts = useRef<Drafts>(new Map()).current;
  const touch = useCallback(() => setVersion(version => version + 1), []);
  return <DraftContext value={{ drafts, touch }}>{children}</DraftContext>;
}

/** 키별 초안. 없으면 initial. clear는 저장 성공·버리기 뒤에 부른다. */
export function useDraft<T>(key: string, initial: T): [T, (next: T) => void, () => void] {
  const store = useContext(DraftContext);
  const [local, setLocal] = useState(initial);
  if (!store) return [local, setLocal, () => setLocal(initial)];
  const value = (store.drafts.has(key) ? store.drafts.get(key) : initial) as T;
  return [value, next => { store.drafts.set(key, next); store.touch(); }, () => { store.drafts.delete(key); store.touch(); }];
}
