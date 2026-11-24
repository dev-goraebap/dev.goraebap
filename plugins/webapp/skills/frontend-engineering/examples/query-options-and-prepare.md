---
arc42: "8.4, 2"
---

# 조회 옵션과 라우트 준비 함수

조회를 소유한 슬라이스의 api에 요청·캐시 키·조회 옵션을 두고, 라우트의 데이터 준비는 꼭 있어야 하는 것과 있으면 좋은 것을 나눈 준비 함수 하나로 합니다. 규칙은 [상태와 데이터 흐름](../references/data-flow.md)에 있습니다.

## react

출처: [web/src/entities/document/api/documents.ts](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/entities/document/api/documents.ts)

```ts
/** Documents a slice at a time; every condition goes into the key, so other conditions start the list over. */
export const documentsOptions = (listing: DocumentListing) => infiniteQueryOptions({
  queryKey: documentKeys.list(listing),
  queryFn: ({ pageParam, signal }) => {
    const params = new URLSearchParams({ size: String(PAGE_SIZE) });
    for (const [name, value] of Object.entries(listing)) if (value !== undefined && value !== false && value !== '') params.set(name, String(value));
    if (pageParam) params.set('cursor', pageParam);
    return getJson<DocumentSlice>(`${BASE}?${params}`, signal);
  },
  initialPageParam: undefined as string | undefined,
  getNextPageParam: last => last.nextCursor ?? undefined,
  placeholderData: keepPreviousData,
});
```

문서 목록의 조회 옵션은 `entities/document`의 `api/`에 있습니다. 목록 조건 전체를 키에 넣어 조건이 바뀌면 다른 캐시 항목이 됩니다.

출처: [web/src/shared/lib/prepare.ts](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/lib/prepare.ts)

```ts
export type Prep = {
  client: QueryClient;
  /** 꼭 있어야 하는 것: 캐시가 있으면 그것을, 없으면 읽어 온다. 실패하면 준비가 멈춘다. */
  ensure: QueryClient['query'];
  ensureInfinite: QueryClient['infiniteQuery'];
  /** 있으면 좋은 것: ensure와 같되 실패해도 넘어간다. */
  prime: QueryClient['query'];
  primeInfinite: QueryClient['infiniteQuery'];
  // …
};
// …
/** 주소(id) 하나의 준비를 돌리고, 무엇을 읽었는지 적어 둔다(isPrepared). */
export async function prepare(client: QueryClient, id: string, run: (prep: Prep) => Promise<unknown>) {
  const keys: QueryKey[] = [];
  const ensure: QueryClient['query'] = options => { keys.push(options.queryKey); return client.query({ ...options, staleTime: 'static' }); };
  const ensureInfinite: QueryClient['infiniteQuery'] = options => { keys.push(options.queryKey); return client.infiniteQuery({ ...options, staleTime: 'static' }); };
  const me = client.getQueryData(sessionOptions().queryKey);
  const prep: Prep = {
    client, ensure, ensureInfinite,
    // 실패는 삼킨다: 값은 쓰지 않고 캐시만 채운다.
    prime: options => ensure(options).catch(() => undefined as never),
    primeInfinite: options => ensureInfinite(options).catch(() => undefined as never),
    body: base => Promise.all([RichBody.preload(), me?.id ? prep.prime(bodyStateOptions(base, me.id)) : undefined]),
  };
  try {
    await run(prep);
    let entries = prepared.get(client);
    if (!entries) { entries = new Map(); prepared.set(client, entries); }
    entries.set(id, keys);
  } catch { /* 화면의 오류 표시로 넘어간다. */ }
}
```

`ensure`는 실패하면 준비를 멈추고 `prime`은 실패를 삼킵니다. 둘 다 사용 중단된 `ensureQueryData` 대신 `client.query()`를 부르고, 캐시가 있으면 기다리지 않도록 신선도 기준을 `staleTime: 'static'`으로 적습니다.

출처: [web/src/pages/_app/workspace/projects/$key/documents/model/prepare.ts](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/pages/_app/workspace/projects/$key/documents/model/prepare.ts)

```ts
/** 문서함의 첫 화면: 연 문서(본문 · 활동)와, 프로젝트의 것이면 그 문서 목록. */
export async function prepareDocuments({ prime, primeInfinite, body }: Prep, { projectKey, documentId }: { projectKey?: string; documentId?: string }) {
  if (documentId) await Promise.all([prime(documentOptions(documentId)), body(`/api/v1/workspace/documents/${documentId}/body`), prime(bodyActivityOptions('documents', documentId))]);
  if (projectKey) await Promise.all([prime(libraryOptions(projectKey)), primeInfinite(documentsOptions({ project: projectKey }))]);
}
```

출처: [web/src/pages/_app/workspace/projects/$key/documents/$documentId/page.tsx](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/pages/_app/workspace/projects/$key/documents/$documentId/page.tsx)

```tsx
export const Route = createFileRoute('/_app/workspace/projects/$key/documents/$documentId/')({
  loader: ({ context, params, location }) => prepare(context.queryClient, location.href,
    prep => prepareDocuments(prep, { projectKey: params.key, documentId: new URLSearchParams(location.searchStr).get('chapter') ?? params.documentId })),
  // …
});
```

문서 화면의 loader는 화면 컴포넌트와 같은 조회 옵션으로 준비 함수를 부릅니다. 목록 위 대화상자로 열 때도 `PanelHost`가 같은 `prepareDocuments`를 씁니다.

## angular

출처: [web/apps/accounts/src/entities/session/api/session.ts](https://github.com/dev-goraebap/dev.goraebap/blob/9ab5efcb944c053f149d5f6cb5e12d1359ef9c7a/web/apps/accounts/src/entities/session/api/session.ts)

```ts
// 로그인한 사람과 세션. 가드·리졸버·화면이 이 조회 옵션 하나를 함께 쓴다.
@Injectable({ providedIn: "root" })
export class SessionApi {
  // …
  readonly me = queryOptions<AuthMe | null>({
    key: [...SESSION_KEY, "me"],
    staleTime: 60_000,
    fetch: async () => {
      // …
    },
  });
```

출처: [web/apps/accounts/src/entities/session/model/guards.ts](https://github.com/dev-goraebap/dev.goraebap/blob/9ab5efcb944c053f149d5f6cb5e12d1359ef9c7a/web/apps/accounts/src/entities/session/model/guards.ts)

```ts
// 계정 화면: 로그인하지 않았으면 로그인으로, 첫 설정 전이면 온보딩으로 보낸다.
export const signedIn: CanActivateFn = async (_route, state) => {
  const router = inject(Router);
  const me = await inject(ServerState).ensure(inject(SessionApi).me);
  if (!me) return router.createUrlTree(["/login"], { queryParams: { next: state.url } });
  if (!me.onboarded) return router.createUrlTree(["/onboarding"]);
  return true;
};
```

출처: [web/apps/accounts/src/shared/lib/server-state.ts](https://github.com/dev-goraebap/dev.goraebap/blob/9ab5efcb944c053f149d5f6cb5e12d1359ef9c7a/web/apps/accounts/src/shared/lib/server-state.ts)

```ts
  // 화면용. 캐시 값을 먼저 보이고, 오래됐으면 뒤에서 다시 읽는다.
  watch<T>(options: QueryOptions<T>): QueryState<T> {
    const entry = this.entry(options);
    if (!entry.fetchedAt || Date.now() - entry.fetchedAt > entry.staleTime) {
      void this.load(entry).catch(() => undefined);
    }
    // …
  }

  // 키 앞부분이 같은 캐시를 오래된 것으로 만들고 다시 읽는다. 다시 읽기가 실패해도 변경 자체는 성공으로 본다.
  async invalidate(prefix: readonly unknown[]): Promise<void> {
    // …
  }

  // 로그아웃·계정 전환. 진행 중인 응답도 새 계정의 캐시에 들어오지 않게 한다.
  clear(): void {
    this.generation += 1;
    this.entries.clear();
  }
```

조회 옵션(`SessionApi.me`)은 엔티티 슬라이스의 api에 두고, 라우트 가드는 `ensure`로 미리 읽고 화면은 `watch`로 같은 캐시를 시그널로 읽습니다. 별도 조회 도구 없이 시그널로 만든 캐시가 무효화와 계정 전환 시 비우기를 맡습니다.
