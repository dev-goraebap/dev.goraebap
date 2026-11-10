import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { TextArea } from '@astryxdesign/core/TextArea';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import { closeHistory } from '@tiptap/pm/history';
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { diagramColors } from '../../foundations/colors';
import { icon } from '../../foundations/icons/solar-icon';
import { CopyButton, useEditable } from './MediaView';
import { LinkCard } from './LinkCard';
import { embedURL, useDiagram } from './diagram';
import { SOURCE_EXAMPLES, sourceNode, type SourceKind } from './schema';
import { diagramSlide, useEditorHost } from './zoom';
import styles from './editor.module.css';

const LABELS: Record<SourceKind, string> = { mermaidBlock: 'Mermaid', webEmbed: '링크 카드' };

/** 그린 SVG는 Mermaid가 만든 글이라(securityLevel strict) 그대로 넣는다. */
function MermaidSvg({ html }: { html: string }) {
  const box = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => { if (box.current) box.current.innerHTML = html; }, [html]);
  return <VStack ref={box} className={styles.mermaidRender} />;
}

/**
 * 원문 하나로 그리는 블록의 노드 뷰: Mermaid 도표와 링크 카드. 도표는 틀 없이 칸 폭을 채우고(원래 크기의 3배까지, 높이 36rem 안),
 * 도구(크게 보기 · 원문 복사 · 편집)는 포인터를 올리거나 초점이 들어오면 오른쪽 위에 뜬다. 원문 편집 칸은 테마 색을 따른다.
 * 링크 카드는 주소를 넣는 점선 칸(올리는 칸과 같은 모양)과 카드로 보인다.
 */
function SourceView({ node, editor, updateAttributes, getPos, selected }: NodeViewProps) {
  const kind = node.type.name as SourceKind, source = String(node.attrs.source ?? ''), label = LABELS[kind];
  const isEditable = useEditable(editor);
  const [isEditing, setEditing] = useState(false), [draft, setDraft] = useState(source);
  const textarea = useRef<HTMLTextAreaElement>(null), address = useRef<HTMLInputElement>(null), previewBox = useRef<HTMLDivElement>(null);
  const { openZoom } = useEditorHost();
  const diagram = useDiagram(isEditing ? draft : source, kind === 'mermaidBlock');
  const embed = useMemo(() => {
    if (kind !== 'webEmbed') return { error: '' };
    const value = isEditing ? draft : source;
    if (!value.trim()) return { error: '웹 주소를 입력하세요.' };
    try { return { ...embedURL(value), error: '' }; } catch (error) { return { error: (error as Error).message }; }
  }, [kind, isEditing, draft, source]);
  const preview = kind === 'mermaidBlock' ? diagram : { pending: false, error: embed.error, html: '' };
  useEffect(() => { setEditing(editor.isEditable && !source.trim()); setDraft(source); }, [source]);
  useEffect(() => { if (!isEditable) setEditing(false); }, [isEditable]);
  useEffect(() => { if (isEditing) (textarea.current ?? address.current)?.focus(); }, [isEditing]);
  const start = () => { if (!isEditable) return; setDraft(source); setEditing(true); };
  // 도표를 크게 보기 창으로 연다(지금 화면 색표의 바탕을 깐 채로).
  const zoom = () => {
    const slide = diagramSlide(previewBox.current?.querySelector('svg'), diagramColors[diagram.scheme].background, `${label} 크게 보기`);
    if (slide) openZoom(slide);
  };
  // 취소: 아직 주소가 없는 새 링크 카드는 빈 블록을 남기지 않고 지운다.
  const cancel = () => {
    const pos = getPos();
    if (kind === 'webEmbed' && !source.trim() && typeof pos === 'number') { editor.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).run(); return; }
    setDraft(source); setEditing(false); editor.commands.focus();
  };
  const apply = () => {
    if (!isEditable || preview.pending || preview.error) return;
    editor.view.dispatch(closeHistory(editor.state.tr));
    updateAttributes({ source: draft.trim() });
    editor.view.dispatch(closeHistory(editor.state.tr));
    setEditing(false);
    const pos = getPos();
    if (typeof pos === 'number') editor.chain().focus().setNodeSelection(pos).run();
  };
  const keys = (isMultiline: boolean) => (event: KeyboardEvent) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); cancel(); }
    if (event.key === 'Enter' && (!isMultiline || event.ctrlKey || event.metaKey)) { event.preventDefault(); event.stopPropagation(); apply(); }
  };
  const render = () => preview.pending ? <Text type="supporting" color="secondary" role="status">미리보기 만드는 중…</Text>
    : preview.error ? <Text type="supporting" className={styles.renderError} role="alert">{label}를 표시할 수 없습니다. {preview.error}</Text>
      : kind === 'webEmbed' && 'host' in embed && embed.host ? <LinkCard url={embed.original} host={embed.host} isEditable={isEditable} onEdit={start} />
        : <MermaidSvg html={diagram.html} />;
  return <NodeViewWrapper as="div" className={`${styles.sourceNode} ${styles[`source-${kind}`]}`} data-selected={selected && isEditable ? '' : undefined}
    data-rich-type={kind} data-block-id={node.attrs.blockId ?? undefined} contentEditable={false}>
    {kind === 'mermaidBlock' ? <HStack className={styles.mediaTools} gap={0.5} vAlign="center">
      {!isEditing && !preview.pending && !preview.error ? <Button label="다이어그램 크게 보기" tooltip="크게 보기" variant="ghost" size="sm" isIconOnly icon={icon('search')} onClick={zoom} /> : null}
      <CopyButton text={source} label="Mermaid 원문 복사" />
      {isEditable && !isEditing ? <Button label={`${label} 편집`} tooltip="편집" variant="ghost" size="sm" isIconOnly icon={icon('edit')} onClick={start} /> : null}
    </HStack> : null}
    {kind === 'webEmbed' && isEditing ? null
      : <VStack ref={previewBox} className={`${styles.sourcePreview}${kind === 'mermaidBlock' && !isEditable ? ` ${styles.zoomable}` : ''}`}
        onDoubleClick={kind === 'mermaidBlock' ? (isEditable ? start : zoom) : undefined}>{render()}</VStack>}
    {isEditable && isEditing && kind === 'webEmbed' ? <VStack className={`${styles.uploadZone} ${styles.embedZone}`} gap={2} hAlign="center" role="group" aria-label="링크 카드 주소 넣기">
      <VStack className={styles.uploadArt} hAlign="center" vAlign="center">{icon('globe')}</VStack>
      <Text>카드로 보여 줄 웹 페이지 주소를 붙여 넣으세요</Text>
      <TextInput ref={address} label="웹 주소" isLabelHidden value={draft} placeholder="https://" className={styles.embedInput} onChange={setDraft} onKeyDown={keys(false)} />
      <Text type="supporting" color="secondary" className={draft.trim() && preview.error ? styles.renderError : undefined} role={draft.trim() && preview.error ? 'alert' : undefined}>
        {draft.trim() && preview.error ? preview.error : '그 페이지의 제목·설명·대표 사진을 카드로 보여 줍니다 · HTTPS 주소만 · Enter 넣기 · Esc 취소'}
      </Text>
      <HStack gap={1.5}><Button label="취소" variant="ghost" size="sm" onClick={cancel} /><Button label="넣기" variant="primary" size="sm" isDisabled={!draft.trim() || !!preview.error} onClick={apply} /></HStack>
    </VStack> : null}
    {isEditable && isEditing && kind === 'mermaidBlock' ? <VStack className={styles.sourceEditor} gap={2} role="group" aria-label={`${label} 원문 편집`}>
      <Text type="supporting" color="secondary">Mermaid 원문</Text>
      <TextArea ref={textarea} label={`${label} 원문`} isLabelHidden value={draft} rows={6} placeholder={SOURCE_EXAMPLES.mermaidBlock} className={styles.sourceArea}
        onChange={setDraft} onKeyDown={keys(true)} />
      <HStack gap={2} vAlign="center" hAlign="end">
        <Text type="supporting" color="secondary">Ctrl+Enter 적용 · Esc 취소</Text>
        <Button label="취소" variant="ghost" size="sm" onClick={cancel} />
        <Button label="적용" variant="primary" size="sm" isDisabled={preview.pending || !!preview.error} onClick={apply} />
      </HStack>
    </VStack> : null}
    {!isEditing && preview.error && kind === 'mermaidBlock' ? <Text type="supporting" color="secondary">{source || `${label}를 편집해 주세요.`}</Text> : null}
  </NodeViewWrapper>;
}

export const sourceNodeViews = (['mermaidBlock', 'webEmbed'] as SourceKind[]).map(kind => sourceNode(kind).extend({ addNodeView() { return ReactNodeViewRenderer(SourceView); } }));
