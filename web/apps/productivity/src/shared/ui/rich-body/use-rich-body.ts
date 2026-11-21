import { uploadBodyFileWithTraits } from './body-files';
import { mapBodySources } from './body-sources';
import { useEffect, useRef, useState } from 'react';
import { useBlocker } from '@tanstack/react-router';
import { blank, prepareDocument, type JSONNode, type VersionRecord } from '@/shared/lib/rich-document';
import { ApiError, type components } from '@/shared/api';

/**
 * A body as the server holds it: its version, the body (null when nothing is written yet) and, when the domain keeps
 * them, its kept versions (newest first) and the address of each file the body names (attachment:<id>).
 */
export type RichBodySnapshot = {
  version: number; body: JSONNode | null; versions?: VersionRecord[]; files?: Readonly<Record<string, string>>;
  /** Each top-level block's version (the body version that last changed it), when the domain keeps blocks. */
  blocks?: Readonly<Record<string, number>>;
};
/**
 * One save: over the version the answer before it gave, with the uploads the body now shows, which the domain binds
 * as its attachments. checkpoint asks the domain to keep this body as a version.
 */
export type RichBodySave = { expectedVersion: number; body: JSONNode; uploadIds: string[]; checkpoint: boolean };
/**
 * One save of the changed top-level blocks only: the blocks' order here, each block written over the block version read
 * (none for a new block), each block deleted, the root attributes when they changed. Blocks changed elsewhere that this
 * save does not touch stay; one this save touches answers 409 (RICH_BODY_BLOCK_CONFLICT).
 */
export type RichBodyPatch = components['schemas']['RichBodyPatch'];
/** What the save line says: nothing yet, changes not saved, being saved, saved, a failure waiting for 다시 시도, or a conflict. */
export type RichBodyStatus = 'loading' | 'idle' | 'unsaved' | 'saving' | 'saved' | 'failed' | 'conflict';
/**
 * The domain's side: load reads the body now, save writes one and answers the body as kept. A save over a version that
 * is no longer the latest answers 409. attachments gives the address of each file the body names (attachment:<id>).
 */
export type BodyEditor = { userId: string; name: string; startedAt: string };
export type EditingStore = {
  key: readonly unknown[];
  read: () => Promise<BodyEditor[]>;
  keep: (lease: string) => Promise<unknown>;
  leave: (lease: string) => Promise<unknown>;
};
export type RichBodyStore = {
  editing?: EditingStore;
  /** 라우트가 준비한 최신 본문. 첫 프레임부터 같은 스냅샷으로 그린다. */
  initialSnapshot?: RichBodySnapshot;
  /** initialSnapshot이 오래된 캐시다: 먼저 그대로 그리고, 뒤에서 최신본을 받아 달라졌는지 본다(stale-while-revalidate). */
  isInitialStale?: boolean;
  load: () => Promise<RichBodySnapshot>;
  save: (input: RichBodySave) => Promise<RichBodySnapshot>;
  /** Saves the changed blocks only, when the domain keeps blocks (save stays for a body whose blocks it cannot tell). */
  patch?: (input: RichBodyPatch) => Promise<RichBodySnapshot>;
  attachments?: Readonly<Record<string, string>>;
  purpose?: NonNullable<components['schemas']['Upload']['purpose']>;
  /** Kept versions, when the domain keeps them: restore makes one the body again over the version given. */
  history?: {
    restore: (versionId: string, expectedVersion: number) => Promise<RichBodySnapshot>;
    /** One kept version's body: the body's version list comes without the bodies (a long body's list was heavy). */
    read: (versionId: string) => Promise<JSONNode | null>;
  };
};

const attachmentRef = (id: string) => `attachment:${id}`;
const blockIdOf = (node: JSONNode): string | undefined =>
  typeof node.attrs?.blockId === 'string' && node.attrs.blockId ? node.attrs.blockId : undefined;
type SyncedBlock = { json: string; version: number };

/**
 * The patch that takes the blocks as last saved or read (synced) to the body here: blocks whose JSON differs are written
 * over the version read, blocks gone are deleted. null when a top-level block has no id or one repeats: such a body
 * saves whole.
 */
function blockPatch(body: JSONNode, synced: ReadonlyMap<string, SyncedBlock>, syncedAttrs: string) {
  const order: string[] = [];
  const puts: RichBodyPatch['puts'] = [];
  const seen = new Set<string>();
  for (const node of body.content ?? []) {
    const id = blockIdOf(node);
    if (!id || seen.has(id)) return null;
    seen.add(id);
    order.push(id);
    const known = synced.get(id);
    if (known?.json !== JSON.stringify(node)) puts.push({ blockId: id, node, expectedVersion: known?.version ?? null });
  }
  const deletes = [...synced].filter(([id]) => !seen.has(id)).map(([blockId, { version }]) => ({ blockId, expectedVersion: version }));
  const attrsJson = JSON.stringify(body.attrs ?? {});
  return { order, puts, deletes, attrs: attrsJson === syncedAttrs ? null : body.attrs ?? {}, attrsJson };
}

/**
 * A body the member writes and saves when they say so (2026-11-04, 명시 저장: nothing is saved on its own). What is
 * typed stays here as the draft until 저장 (or Ctrl+S, or 편집 완료); then the body goes in one line of
 * saves, each over the version the answer before it gave, and each save is kept as a version. A 409 keeps the draft and
 * stops until the member picks the latest body or saves theirs over it; another failure keeps the draft and waits for
 * 다시 시도. Leaving with a draft not saved asks first, as does leaving with something else of the detail not saved
 * (isOtherChanged: a title written with it).
 */
export function useRichBody(store: RichBodyStore, isOtherChanged: () => boolean = () => false) {
  const [initial] = useState(() => {
    const snapshot = store.initialSnapshot;
    const sources = new Map(Object.entries({ ...store.attachments, ...snapshot?.files }).map(([id, url]) => [attachmentRef(id), url]));
    const body = snapshot ? prepareDocument(snapshot.body ?? blank) as JSONNode : null;
    return { snapshot, sources, body };
  });
  const [epoch, setEpoch] = useState(0);
  const [value, setValue] = useState<JSONNode | null>(() => initial.body ? mapBodySources(initial.body, initial.sources) : null);
  const [status, setStatus] = useState<RichBodyStatus>(initial.snapshot ? 'idle' : 'loading');
  const [failure, setFailure] = useState('');
  const [isLeaveAsked, setLeaveAsked] = useState(false);
  const [versions, setVersions] = useState<VersionRecord[]>(initial.snapshot?.versions ?? []);
  /** 캐시로 그린 뒤 받아 보니 다른 곳에서 본문이 바뀌었다. 읽는 중인 글을 바꾸지 않고 알리기만 한다. */
  const [newer, setNewer] = useState<RichBodySnapshot | null>(null);
  /** A save of blocks answered blocks changed elsewhere too: kept on the server, not shown here until the latest is taken. */
  const [isMerged, setMergedState] = useState(false);
  const merged = useRef(false);
  const setMerged = (value: boolean) => { merged.current = value; setMergedState(value); };
  /** Set by 내 내용으로 다시 저장: the next save may write the whole body over changes made elsewhere. */
  const isOverLatest = useRef(false);
  const leaveAnswer = useRef<((leave: boolean) => void) | null>(null);
  const version = useRef(initial.snapshot?.version ?? 0);
  /** The body the editor last gave (with attachment:<id> sources), and its JSON as last saved or read. */
  const draft = useRef<JSONNode | null>(initial.body);
  const sent = useRef<string | null>(null);
  /**
   * Each top-level block as last saved or read here (its JSON as the editor gave it) with its block version, and the
   * root attributes' JSON: a save of blocks sends what differs from them. blockVersions are the versions read, until
   * the editor gives its first body.
   */
  const synced = useRef(new Map<string, SyncedBlock>());
  const syncedAttrs = useRef('{}');
  const blockVersions = useRef<Readonly<Record<string, number>>>(initial.snapshot?.blocks ?? {});
  /** The editor's body not yet made into the draft (settle), and the timer that will. */
  const shownPending = useRef<JSONNode | null>(null);
  const settleTimer = useRef(0);
  const isDirty = useRef(false);
  const isStopped = useRef(false);
  const queue = useRef<Promise<void>>(Promise.resolve());
  /** attachment:<id> to the address shown, the files the body has from the domain and those uploaded here. */
  const sources = useRef(initial.sources);
  const uploads = useRef(new Set<string>());
  const blobs = useRef<string[]>([]);
  const latest = useRef(store);
  latest.current = store;
  const otherChanged = useRef(isOtherChanged);
  otherChanged.current = isOtherChanged;
  const isUnsaved = () => isDirty.current || otherChanged.current();

  /** What the server says of the versions and files, the body itself left as it is. */
  const hear = (snapshot: RichBodySnapshot) => {
    Object.entries(snapshot.files ?? {}).forEach(([id, url]) => sources.current.set(attachmentRef(id), url));
    if (snapshot.versions) setVersions(snapshot.versions);
  };
  const adopt = (snapshot: RichBodySnapshot) => {
    hear(snapshot);
    const body = prepareDocument(snapshot.body ?? blank) as JSONNode;
    version.current = snapshot.version;
    blockVersions.current = snapshot.blocks ?? {};
    setMerged(false);
    draft.current = body; sent.current = null; shownPending.current = null; window.clearTimeout(settleTimer.current);
    isDirty.current = false; isStopped.current = false;
    setValue(mapBodySources(body, sources.current));
    setEpoch(count => count + 1);
    setFailure('');
    setStatus('idle');
  };
  const stop = (error: unknown) => {
    isStopped.current = true;
    if (error instanceof ApiError && error.status === 409) setStatus('conflict');
    else { setStatus('failed'); setFailure(error instanceof Error ? error.message : '저장하지 못했습니다.'); }
  };

  useEffect(() => {
    let isAlive = true;
    const ownedBlobs = blobs.current;
    Object.entries(store.attachments ?? {}).forEach(([id, url]) => sources.current.set(attachmentRef(id), url));
    if (!initial.snapshot) store.load().then(snapshot => { if (isAlive) adopt(snapshot); }, (error: unknown) => { if (isAlive) stop(error); });
    // 오래된 캐시로 그렸으면 뒤에서 확인한다. 같은 버전이면 버전 목록·파일만 받고, 달라졌으면 알림만 띄운다.
    else if (store.isInitialStale) store.load().then(snapshot => {
      if (!isAlive) return;
      if (snapshot.version === version.current) hear(snapshot); else setNewer(snapshot);
    }, () => undefined);
    return () => { isAlive = false; window.clearTimeout(settleTimer.current); ownedBlobs.forEach(url => URL.revokeObjectURL(url)); };
    // Mounted with the body's key: a draft never crosses to another body.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** The blocks of a body as saved or read, at the given block versions (a block without one is new to the server). */
  const baseline = (body: JSONNode, versions: Readonly<Record<string, number>>) => {
    synced.current = new Map((body.content ?? []).flatMap(node => {
      const id = blockIdOf(node);
      const blockVersion = id === undefined ? undefined : versions[id];
      return id !== undefined && blockVersion !== undefined ? [[id, { json: JSON.stringify(node), version: blockVersion }] as const] : [];
    }));
    syncedAttrs.current = JSON.stringify(body.attrs ?? {});
  };

  /**
   * Sends the draft: its changed blocks when the domain keeps blocks (blocks changed elsewhere meanwhile stay there),
   * else the whole body over the version read.
   */
  const send = async (body: JSONNode, uploadIds: string[]) => {
    const store = latest.current;
    const patch = store.patch ? blockPatch(body, synced.current, syncedAttrs.current) : null;
    if (!store.patch || !patch) {
      // A whole body over blocks changed elsewhere that this editor does not show would undo them: ask first (the
      // conflict's 내 내용으로 다시 저장 says to write it anyway).
      if (merged.current && !isOverLatest.current)
        throw new ApiError(409, '다른 곳에서 바뀐 내용이 있어 본문 전체를 저장하지 않았습니다.', 'RICH_BODY_BLOCK_CONFLICT');
      isOverLatest.current = false;
      const saved = await store.save({ expectedVersion: version.current, body, uploadIds, checkpoint: true });
      baseline(body, saved.blocks ?? {});
      setMerged(false);
      return saved;
    }
    const { attrsJson, ...change } = patch;
    const saved = await store.patch({ ...change, uploadIds, checkpoint: true });
    const answered = saved.blocks ?? {};
    const written = new Set(change.puts.map(put => put.blockId));
    const deleted = new Set(change.deletes.map(gone => gone.blockId));
    // Blocks this save did not write that changed elsewhere (or are new or gone there) are on the server, not here.
    const isChangedElsewhere = [...synced.current].some(([id, block]) => !written.has(id) && !deleted.has(id) && answered[id] !== block.version)
      || Object.keys(answered).some(id => !written.has(id) && !synced.current.has(id));
    for (const put of change.puts) {
      const blockVersion = answered[put.blockId];
      if (blockVersion !== undefined) synced.current.set(put.blockId, { json: JSON.stringify(put.node), version: blockVersion });
    }
    deleted.forEach(id => synced.current.delete(id));
    syncedAttrs.current = attrsJson;
    if (isChangedElsewhere) setMerged(true);
    return saved;
  };

  /** Saves the draft, kept as a version; nothing to save, nothing goes. */
  const save = (): Promise<void> => {
    settle();
    const job = queue.current.then(async () => {
      settle();
      const body = draft.current;
      if (isStopped.current) throw new Error('저장 문제를 해결한 뒤 다시 시도해 주세요.');
      if (!body || !isDirty.current) return;
      setStatus('saving');
      const json = JSON.stringify(body);
      const uploadIds = [...uploads.current].filter(id => json.includes(attachmentRef(id)));
      try {
        const saved = await send(body, uploadIds);
        version.current = saved.version;
        sent.current = json;
        hear(saved);
        uploadIds.forEach(id => uploads.current.delete(id));
        // Typing that came while this went is still to be saved.
        if (draft.current === body && !shownPending.current) isDirty.current = false;
        setStatus(isDirty.current ? 'unsaved' : 'saved');
      } catch (error) {
        stop(error);
        throw error;
      }
    });
    queue.current = job.catch(() => undefined);
    return job;
  };

  /**
   * The editor's last body made into the draft (files back to attachment:<id>), and compared with what was saved. Done
   * when typing pauses, before a save and when the draft is read: doing it on every key turned a long body (hundreds of
   * KB) into a pause on every key.
   */
  const settle = () => {
    window.clearTimeout(settleTimer.current);
    const shown = shownPending.current;
    if (!shown) return;
    shownPending.current = null;
    const reverse = new Map([...sources.current].map(([ref, url]) => [url, ref]));
    const body = mapBodySources(shown, reverse);
    const json = JSON.stringify(body);
    draft.current = body;
    // The editor gives its own form of the body it read when it starts: that is the saved state, not a change.
    if (sent.current === null) { sent.current = json; baseline(body, blockVersions.current); return; }
    if (json === sent.current) {
      if (isDirty.current) { isDirty.current = false; setStatus('saved'); }
      return;
    }
    isDirty.current = true;
    if (!isStopped.current) setStatus('unsaved');
  };
  /** The editor's body, after each change: marked unsaved at once, made into the draft when typing pauses. */
  const change = (shown: JSONNode) => {
    shownPending.current = shown;
    if (sent.current === null) { settle(); return; }
    isDirty.current = true;
    if (!isStopped.current) setStatus('unsaved');
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(settle, 300);
  };

  // Leaving waits for a save under way; a draft not saved asks first.
  useBlocker({
    shouldBlockFn: async () => {
      await queue.current;
      if (!isUnsaved()) return false;
      setLeaveAsked(true);
      const leave = await new Promise<boolean>(resolve => { leaveAnswer.current = resolve; });
      setLeaveAsked(false);
      return !leave;
    },
    enableBeforeUnload: () => isUnsaved(),
  });

  /** Uploads a file the member put in the body: straight to storage, then named by attachment:<id> until it is saved. */
  const upload = async (file: File, progress?: (value: number) => void, signal?: AbortSignal) => {
    const { id, traits } = await uploadBodyFileWithTraits(file, signal, latest.current.purpose);
    const url = URL.createObjectURL(file);
    blobs.current.push(url);
    sources.current.set(attachmentRef(id), url);
    uploads.current.add(id);
    progress?.(100);
    return { url, name: file.name, mime: file.type || 'application/octet-stream', size: file.size, ...traits };
  };

  /**
   * Makes a kept version the body again: a draft not saved is saved first (so 복원 never loses it), then the version comes
   * back as the body over the version just saved, in a new editor.
   */
  const restore = async (versionId: string) => {
    const history = latest.current.history;
    if (!history) return;
    await save();
    adopt(await history.restore(versionId, version.current));
  };

  /** After a conflict: the latest body replaces the draft. */
  const takeLatest = async () => { setNewer(null); adopt(await latest.current.load()); };
  /** After a conflict: the draft is saved over the latest body. */
  const keepMine = async () => {
    const current = await latest.current.load();
    version.current = current.version;
    // Only the blocks changed or deleted here go over the latest block versions (those gone there come back as new);
    // a block changed only elsewhere keeps the version read, so editing it later still conflicts instead of undoing it.
    settle();
    const here = new Map((draft.current?.content ?? []).flatMap(node => {
      const id = blockIdOf(node);
      return id === undefined ? [] : [[id, JSON.stringify(node)] as const];
    }));
    const latestBlocks = current.blocks ?? {};
    let isChangedElsewhere = false;
    for (const [id, block] of synced.current) {
      const blockVersion = latestBlocks[id];
      if (here.get(id) !== block.json) {
        if (blockVersion === undefined) synced.current.delete(id); else block.version = blockVersion;
      } else if (blockVersion !== block.version) isChangedElsewhere = true;
    }
    if (isChangedElsewhere || Object.keys(latestBlocks).some(id => !synced.current.has(id) && !here.has(id))) setMerged(true);
    isOverLatest.current = true;
    isStopped.current = false; isDirty.current = true;
    setFailure('');
    try { await save(); } finally { isOverLatest.current = false; }
  };
  /** After a failure: the draft is sent again. */
  const retry = async () => { isStopped.current = false; setFailure(''); await save(); };

  return {
    /** The editor's key: a new body read (the first, the latest after a conflict) starts a new editor. */
    documentId: `rich-body:${epoch}`,
    value, status, failure, change, save, upload, takeLatest, keepMine, retry,
    /** 캐시로 그린 뒤 다른 곳에서 바뀐 것을 알았다(takeLatest로 바꾼다). */
    hasNewer: isMerged || (newer !== null && newer.version !== version.current),
    /** Whether something typed here is not saved yet. */
    isUnsaved: () => isDirty.current,
    /** The kept versions. */
    versions, restore,
    /** A body from the server shown here: its files at the addresses they open from. */
    hydrate: (body: JSONNode) => mapBodySources(body, sources.current),
    /** The body as it now stands here, typing included (files as attachment:<id>), to compare a kept version with. */
    current: () => { settle(); return draft.current; },
    leave: { isAsked: isLeaveAsked, answer: (leave: boolean) => leaveAnswer.current?.(leave) },
  };
}
