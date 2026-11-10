import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Selector } from '@astryxdesign/core/Selector';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { closeHistory } from '@tiptap/pm/history';
import type { Editor } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { icon } from '../../foundations/icons/solar-icon';
import { bytes, clampWidth, fileKind } from './file-kinds';
import { Media, safeSource } from './schema';
import { useEditorHost } from './zoom';
import styles from './editor.module.css';

/** 노드 뷰 안에서 지금 편집할 수 있는지. 읽기·편집을 오가도 노드 뷰는 다시 만들어지지 않는다. */
export function useEditable(editor: Editor) {
  const [isEditable, setEditable] = useState(editor.isEditable);
  useEffect(() => {
    const update = () => setEditable(editor.isEditable);
    editor.on('transaction', update); editor.on('update', update); update();
    return () => { editor.off('transaction', update); editor.off('update', update); };
  }, [editor]);
  return isEditable;
}

/** 원문을 복사하는 도구. 결과는 잠시 아이콘과 상태 문구로 알린다. */
export function CopyButton({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'error'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return <Button label={label} tooltip={state === 'copied' ? '복사됨' : state === 'error' ? '복사하지 못했습니다' : label} variant="ghost" size="sm" isIconOnly
    icon={icon(state === 'copied' ? 'check' : state === 'error' ? 'alert-circle' : 'copy')}
    onClick={async () => {
      try { await navigator.clipboard.writeText(text); setState('copied'); } catch { setState('error'); }
      clearTimeout(timer.current); timer.current = setTimeout(() => setState('idle'), 1800);
    }} />;
}

/** 이미 받은 사진: 다시 나오면 바로 보인다(서서히 나타나지 않는다). */
const arrived = new Set<string>();
const isAtHand = (src: string) => {
  if (!src) return false;
  if (arrived.has(src)) return true;
  const probe = new Image();
  probe.src = src;
  return probe.complete && probe.naturalWidth > 0;
};

const LABELS = { image: '이미지', video: '동영상', audio: '오디오', file: '파일' } as const;

/**
 * 사진·동영상·오디오·파일 블록. 머리 띠·상자 틀·사진 아래 이름 줄이 없다. 도구(크게 보기 · 너비 · 내려받기)는 포인터를 올리거나
 * 초점이 들어오면 블록 오른쪽 위에 뜬다. 사진은 올릴 때 잰 원본 비율로 자리를 먼저 잡고 대표색으로 칠한 뒤 나타나며, 너비를
 * 25%·50%로 줄인 사진끼리는 한 줄에 나란히 놓인다. 파일은 확장자의 색을 띤 카드로, HTML 파일은 그 아래 격리된 미리보기 틀로 보인다.
 * 사진·영상·격리 틀은 키트 부품이 없어 <img>·<video>·<audio>·<iframe>을 그대로 쓰고, 비율·대표색·너비는 블록마다 달라 인라인으로 준다.
 */
function MediaView({ node, editor, updateAttributes, getPos, selected }: NodeViewProps) {
  const isEditable = useEditable(editor), { openZoom, openHtml } = useEditorHost(), a = node.attrs;
  const mime = String(a.mime), name = String(a.name);
  const kind = mime.startsWith('image/') ? 'image' : mime.startsWith('video/') ? 'video' : mime.startsWith('audio/') ? 'audio' : 'file';
  const safe = safeSource(a.src), width = clampWidth(a.width), label = LABELS[kind];
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading'), [retry, setRetry] = useState(0), [size, setSize] = useState(Number(a.size) || 0);
  const stage = useRef<HTMLDivElement>(null), picture = useRef<HTMLImageElement>(null), [isNearby, setNearby] = useState(false);
  const src = retry && !safe.startsWith('blob:') ? `${safe}${safe.includes('?') ? '&' : '?'}retry=${retry}` : safe;
  // 올릴 때 잰 대표색과 원본 비율이 있으면 자리를 먼저 그 색·비율로 칠하고, 받아야 하는 사진만 서서히 나타낸다(이미 받은 사진은 바로).
  const color = kind === 'image' && typeof a.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(a.color) ? a.color : undefined;
  const ratio = kind === 'image' && Number(a.pixelWidth) > 0 && Number(a.pixelHeight) > 0 ? `${a.pixelWidth} / ${a.pixelHeight}` : undefined;
  const [atHand] = useState(() => isAtHand(safe));
  useLayoutEffect(() => {
    setState('loading');
    if (!safe) { setState('error'); return; }
    if (kind !== 'file') return;
    if (safe.startsWith('blob:')) { setSize(Number(a.size) || 0); setState('ready'); return; }
    const controller = new AbortController();
    void fetch(src, { method: 'HEAD', signal: controller.signal })
      .then(response => { if (!response.ok) throw Error(); setSize(Number(response.headers.get('content-length')) || Number(a.size) || 0); setState('ready'); })
      .catch(error => { if (error.name !== 'AbortError') setState('error'); });
    return () => controller.abort();
  }, [src, kind, safe]);
  useEffect(() => {
    if (!stage.current) return;
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) setNearby(true); }, { rootMargin: '300px' });
    observer.observe(stage.current);
    return () => observer.disconnect();
  }, [kind]);
  useEffect(() => {
    if (state !== 'loading' || (kind !== 'file' && !isNearby)) return;
    const timer = setTimeout(() => setState('error'), 15000);
    return () => clearTimeout(timer);
  }, [state, retry, isNearby, kind]);
  const changeWidth = (value: number) => {
    editor.view.dispatch(closeHistory(editor.state.tr));
    updateAttributes({ width: value });
    editor.view.dispatch(closeHistory(editor.state.tr));
    const pos = getPos();
    if (typeof pos === 'number') editor.chain().focus().setNodeSelection(pos).run();
  };
  const status = state === 'loading' && color ? null
    : state === 'error' ? <VStack className={styles.mediaState} data-state="error" gap={2} hAlign="center" vAlign="center" role="alert">
      {icon('alert-circle')}<Text weight="medium">{label}를 불러오지 못했습니다</Text><Text type="supporting" color="secondary">연결이나 파일 상태를 확인해 주세요.</Text>
      <Button label="다시 시도" variant="secondary" size="sm" icon={icon('retry')} onClick={() => setRetry(n => n + 1)} />
    </VStack>
      : state === 'loading' ? <HStack className={styles.mediaState} data-state="loading" gap={2} hAlign="center" vAlign="center" role="status">
        {icon('retry')}<Text type="supporting" color="secondary">{label} 불러오는 중…</Text>
      </HStack> : null;
  const zoom = () => {
    const image = picture.current;
    if (image) openZoom({ src: image.currentSrc || src, alt: name, width: Number(a.pixelWidth) || image.naturalWidth || undefined, height: Number(a.pixelHeight) || image.naturalHeight || undefined });
  };
  const file = fileKind(name);
  // HTML 파일은 카드 아래에 미리보기를 둔다. 올린 사람의 스크립트가 들어 있을 수 있으므로 격리된 틀(sandbox, 같은 출처 권한 없음)
  // 안에서만 그린다: 틀 안의 문서는 이 앱의 화면·쿠키·저장소에 닿지 못한다.
  const isHtml = kind === 'file' && (mime === 'text/html' || /\.html?$/i.test(name));
  // 블록 위에 떠 있는 도구: 포인터를 올리거나 초점이 들어오면 보인다(머리 띠를 두지 않는다).
  const tools = <HStack className={styles.mediaTools} gap={0.5} vAlign="center">
    {kind === 'image' && state === 'ready' ? <Button label={`${name} 크게 보기`} tooltip="크게 보기" variant="ghost" size="sm" isIconOnly icon={icon('search')} onClick={zoom} /> : null}
    {isHtml && safe && state !== 'error' ? <Button label={`${name} 크게 보기`} tooltip="크게 보기" variant="ghost" size="sm" isIconOnly icon={icon('search')} onClick={() => openHtml({ src, title: name })} /> : null}
    {isEditable && (kind === 'image' || kind === 'video') ? <Selector label="미디어 너비" isLabelHidden size="sm" variant="ghost" value={String(width)}
      options={[...(![25, 50, 75, 100].includes(width) ? [width] : []), 25, 50, 75, 100].map(n => ({ value: String(n), label: `${n}%` }))}
      onChange={value => changeWidth(Number(value))} /> : null}
    <Button label={`${name} 다운로드`} tooltip="다운로드" variant="ghost" size="sm" isIconOnly icon={icon('download')} href={safe || undefined} {...{ download: name }} />
  </HStack>;
  // 사진의 자리: 원본 비율을 알면 그 비율로, 너무 긴 사진은 높이 한도(--media-max-block)에 맞춘 폭으로 잡아 가운데에 둔다.
  const box: CSSProperties | undefined = kind === 'image' && ratio && state !== 'error'
    ? { aspectRatio: ratio, inlineSize: `min(100%, calc(var(--media-max-block) * ${a.pixelWidth} / ${a.pixelHeight}))`, backgroundColor: state === 'ready' ? undefined : color }
    : state === 'error' ? undefined : { backgroundColor: color };
  return <NodeViewWrapper as="figure" className={styles.media} data-kind={kind} data-html={isHtml ? '' : undefined} data-selected={selected && isEditable ? '' : undefined}
    data-media="" data-width={width} data-block-id={a.blockId} data-media-state={state} style={kind === 'image' || kind === 'video' ? { width: `${width}%` } : undefined} contentEditable={false}>
    {kind === 'file' ? <HStack className={styles.fileCard} data-tone={file.tone} gap={3} vAlign="center">
      <VStack className={styles.fileTile} hAlign="center" vAlign="center" aria-hidden>{icon('document')}<Text weight="bold" className={styles.fileTileLabel}>{file.label}</Text></VStack>
      <VStack className={styles.fileText} gap={0.5}>
        <Text weight="semibold" maxLines={1}>{name}</Text>
        <Text type="supporting" color="secondary">{[file.name, bytes(size)].filter(Boolean).join(' · ')}</Text>
      </VStack>
      {tools}
    </HStack> : <VStack ref={stage} className={styles.mediaStage} data-state={state} data-ratio={ratio ? '' : undefined} style={box}>
      {safe && kind === 'image' ? <img ref={picture} key={src} src={src} alt={name} loading="lazy" data-fade={color && !atHand ? '' : undefined} data-zoomable={!isEditable ? '' : undefined}
        // 읽기 화면에서 누르면 크게 보기로 연다(편집 중에는 누르기가 선택이라 두지 않는다).
        onClick={isEditable ? undefined : zoom} onLoad={() => { arrived.add(src); setState('ready'); }} onError={() => setState('error')} /> : null}
      {safe && kind === 'video' ? <video key={src} src={src} controls preload="metadata" aria-label={name} onLoadedMetadata={() => setState('ready')} onError={() => setState('error')}
        onWaiting={() => setState(previous => previous === 'error' ? previous : 'loading')} onCanPlay={() => setState('ready')} /> : null}
      {safe && kind === 'audio' ? <audio key={src} src={src} controls preload="metadata" aria-label={name} onLoadedMetadata={() => setState('ready')} onError={() => setState('error')} /> : null}
      {status}
      {tools}
    </VStack>}
    {isHtml && safe && state !== 'error' ? <iframe className={styles.htmlFrame} src={src} title={`${name} 미리보기`} sandbox="allow-scripts allow-modals allow-forms allow-popups" referrerPolicy="no-referrer" loading="lazy" /> : null}
    {kind === 'file' ? status : null}
  </NodeViewWrapper>;
}

export const MediaNodeView = Media.extend({ addNodeView() { return ReactNodeViewRenderer(MediaView); } });
