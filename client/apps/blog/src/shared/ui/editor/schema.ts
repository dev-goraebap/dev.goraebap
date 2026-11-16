import { Extension, Node, mergeAttributes, type AnyExtension, type Editor, type JSONContent } from '@tiptap/core';
import Highlight from '@tiptap/extension-highlight';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { Table, TableKit, TableView } from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyleKit } from '@tiptap/extension-text-style';
import { Plugin } from '@tiptap/pm/state';
import { columnResizing } from '@tiptap/pm/tables';
import StarterKit from '@tiptap/starter-kit';
import { GlobeIcon, HeadingIcon, ListChecksIcon, ListIcon, ListOrderedIcon, MinusIcon, PaperclipIcon, PilcrowIcon, QuoteIcon, SquareCodeIcon, StructureIcon, TableIcon, type Icon } from '@/shared/ui/icon';
import { UploadZone } from './upload-zone';

/** 본문 제목은 2단계부터다. 화면에는 늘 시스템 제목(1단계) 하나가 있다. */
export const HEADING_LEVELS = [2, 3, 4] as const;
export type HeadingLevel = typeof HEADING_LEVELS[number];

/** 블록마다 안정 ID(blockId)를 두는 노드. 블록 메뉴·블록 링크(#block-…)·끌어 옮기기가 이 ID로 블록을 찾는다. */
const BLOCK_TYPES = ['paragraph', 'heading', 'blockquote', 'bulletList', 'orderedList', 'taskList', 'codeBlock', 'horizontalRule', 'table',
  'media', 'mermaidBlock', 'webEmbed'];

export const blank: JSONContent = { type: 'doc', content: [{ type: 'paragraph' }] };

/** 처음 여는 본문을 다듬는다: 빠지거나 겹친 blockId를 채우고, 저장된 본문의 1단계 제목은 2단계로 내린다. */
export function prepareDocument(value: JSONContent | undefined): JSONContent {
  const copy: JSONContent = structuredClone(value?.type === 'doc' ? value : blank);
  const seen = new Set<string>();
  const walk = (node: JSONContent) => {
    if (node.type && BLOCK_TYPES.includes(node.type)) {
      node.attrs ??= {};
      if (!node.attrs.blockId || seen.has(node.attrs.blockId)) node.attrs.blockId = crypto.randomUUID();
      seen.add(node.attrs.blockId);
    }
    if (node.type === 'heading' && !HEADING_LEVELS.includes(node.attrs?.level)) node.attrs = { ...node.attrs, level: 2 };
    node.content?.forEach(walk);
  };
  walk(copy);
  if (!copy.content?.length) copy.content = [{ type: 'paragraph' }];
  return copy;
}

/** 내려받거나 그릴 수 있는 주소: 앱 안의 주소, HTTPS, 호스트가 수명을 맡는 blob. 그 밖은 빈 글. */
export const safeSource = (value: unknown) => /^(\/(?!\/)|https:\/\/|blob:)/.test(String(value)) ? String(value) : '';

/** 사진·동영상·오디오·파일 블록. 사진은 올릴 때 잰 대표색과 원본 가로·세로를 함께 둔다. */
export const Media = Node.create({
  name: 'media', group: 'block', atom: true, draggable: true,
  addAttributes() {
    return {
      src: { default: '', parseHTML: element => element.getAttribute('data-src') ?? '' },
      name: { default: '첨부 파일', parseHTML: element => element.getAttribute('data-name') ?? '첨부 파일' },
      mime: { default: 'application/octet-stream', parseHTML: element => element.getAttribute('data-mime') ?? 'application/octet-stream' },
      width: { default: 100, parseHTML: element => Number(element.getAttribute('data-width')) || 100 },
      size: { default: 0, parseHTML: element => Number(element.getAttribute('data-size')) || 0 },
      color: { default: null, parseHTML: element => element.getAttribute('data-color') },
      pixelWidth: { default: null, parseHTML: element => Number(element.getAttribute('data-pixel-width')) || null },
      pixelHeight: { default: null, parseHTML: element => Number(element.getAttribute('data-pixel-height')) || null },
    };
  },
  parseHTML: () => [{ tag: 'figure[data-media]' }],
  renderHTML: ({ HTMLAttributes: a }) => {
    const src = safeSource(a.src), mime = String(a.mime);
    const child = mime.startsWith('image/') ? ['img', { src, alt: a.name, loading: 'lazy' }]
      : mime.startsWith('video/') ? ['video', { src, controls: '', preload: 'metadata' }]
        : mime.startsWith('audio/') ? ['audio', { src, controls: '', preload: 'metadata' }] : ['a', { href: src, download: a.name }, a.name];
    return ['figure', mergeAttributes({ 'data-media': '', 'data-name': a.name, 'data-mime': mime, 'data-src': src, 'data-width': a.width, 'data-size': a.size },
      a.color ? { 'data-color': a.color } : {}, a.pixelWidth && a.pixelHeight ? { 'data-pixel-width': a.pixelWidth, 'data-pixel-height': a.pixelHeight } : {},
      a.blockId ? { 'data-block-id': a.blockId } : {}), child];
  },
});

/** 원문(source) 하나로 그리는 블록: Mermaid 도표와 링크 카드(웹 주소). */
export type SourceKind = 'mermaidBlock' | 'webEmbed';
export const SOURCE_EXAMPLES: Record<SourceKind, string> = { mermaidBlock: 'flowchart LR\n  A[생각] --> B[문서]\n  B --> C[공유]', webEmbed: '' };
export const sourceNode = (kind: SourceKind) => Node.create({
  name: kind, group: 'block', atom: true, selectable: true, draggable: true,
  addAttributes() {
    return { source: { default: SOURCE_EXAMPLES[kind], parseHTML: element => element.getAttribute('data-source') ?? element.textContent ?? '',
      renderHTML: attrs => ({ 'data-source': attrs.source }) } };
  },
  parseHTML: () => [{ tag: `figure[data-rich-type="${kind}"]` }],
  renderHTML: ({ HTMLAttributes }) => ['figure', mergeAttributes(HTMLAttributes, { 'data-rich-type': kind }), ['pre', {}, String(HTMLAttributes['data-source'] ?? '')]],
});

/** 블록 ID를 채우고, 복사·붙여넣기로 겹친 ID는 새로 준다(실행 취소 단계에 넣지 않는다). */
const BlockIdentity = Extension.create({
  name: 'blockIdentity',
  addGlobalAttributes() {
    return [{ types: BLOCK_TYPES, attributes: { blockId: { default: null, parseHTML: element => element.getAttribute('data-block-id'),
      renderHTML: attrs => attrs.blockId ? { 'data-block-id': attrs.blockId } : {} } } }];
  },
  addProseMirrorPlugins() {
    return [new Plugin({ appendTransaction: (transactions, _old, state) => {
      if (!transactions.some(tr => tr.docChanged)) return null;
      const seen = new Set<string>();
      let tr = state.tr;
      state.doc.descendants((node, pos) => {
        if (!('blockId' in node.attrs)) return;
        const id = node.attrs.blockId as string | null;
        if (!id || seen.has(id)) { const next = crypto.randomUUID(); tr = tr.setNodeMarkup(pos, undefined, { ...node.attrs, blockId: next }); seen.add(next); }
        else seen.add(id);
      });
      return tr.docChanged ? tr.setMeta('addToHistory', false) : null;
    } })];
  },
});

/** 너비가 없어진 열의 <col>에서 옛 너비를 지운다. Tiptap의 TableView는 너비를 쓰기만 해서, 너비 조절을 실행 취소해도 화면의 열이 그대로였다. */
class SyncedTableView extends TableView {
  update(node: Parameters<TableView['update']>[0]) {
    if (!super.update(node)) return false;
    let index = 0;
    node.firstChild?.forEach(cell => {
      const widths = cell.attrs.colwidth as number[] | null;
      for (let span = 0; span < (cell.attrs.colspan || 1); span++, index++) {
        const col = this.colgroup.children[index] as HTMLElement | undefined;
        if (col && !widths?.[span]) col.style.removeProperty('width');
      }
    });
    return true;
  }
}

/**
 * 열 경계를 끌어 너비를 바꾸는 표. Tiptap의 표는 에디터가 만들어지는 순간 편집할 수 있을 때만 열 너비 조절을 붙이는데,
 * 본문은 읽기로 열렸다가 편집으로 바뀔 수 있어 그대로 두면 한 번도 붙지 않는다. 그래서 늘 붙여 두고, 읽는 동안에는 조절
 * 기능이 스스로 쉰다(prosemirror-tables가 view.editable을 확인한다).
 */
const ResizableTable = Table.extend({
  addProseMirrorPlugins() {
    const base = this.parent?.() ?? [];
    if (!this.options.resizable || this.editor.isEditable) return base;
    return [columnResizing({ handleWidth: this.options.handleWidth, cellMinWidth: this.options.cellMinWidth, defaultCellMinWidth: this.options.cellMinWidth,
      View: this.options.View, lastColumnResizable: this.options.lastColumnResizable }), ...base];
  },
  addNodeView() { return this.options.resizable ? null : this.parent?.() ?? null; },
});

/** 본문 칸의 확장 묶음. 노드 뷰(사진·도표·링크 카드)는 RichEditor가 넘긴다. */
export function editorExtensions(nodeViews: AnyExtension[]): AnyExtension[] {
  return [
    StarterKit.configure({ heading: { levels: [...HEADING_LEVELS] },
      link: { openOnClick: false, defaultProtocol: 'https', HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } } }),
    TableKit.configure({ table: false }), ResizableTable.configure({ resizable: true, cellMinWidth: 120, View: SyncedTableView }),
    TaskList, TaskItem.configure({ nested: true }), TextStyleKit, Highlight.configure({ multicolor: true }), TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Subscript, Superscript, UploadZone, ...nodeViews, BlockIdentity,
  ];
}

export type CommandId = 'paragraph' | `heading${HeadingLevel}` | 'bulletList' | 'orderedList' | 'taskList' | 'blockquote' | 'table' | 'horizontalRule'
  | 'codeBlock' | 'mermaidBlock' | 'html' | 'webEmbed' | 'file';
export type BlockCommand = { id: CommandId; label: string; group: string; hint: string };
const HEADING_HINTS: Record<HeadingLevel, string> = { 2: '큰 구획 제목', 3: '중간 제목', 4: '작은 제목' };

/** 블록 명령의 아이콘. `/` 목록과 상단 서식 막대의 넣기 메뉴가 같이 쓴다. */
export const COMMAND_ICONS: Record<CommandId, Icon> = { paragraph: PilcrowIcon, heading2: HeadingIcon, heading3: HeadingIcon, heading4: HeadingIcon, bulletList: ListIcon,
  orderedList: ListOrderedIcon, taskList: ListChecksIcon, blockquote: QuoteIcon, table: TableIcon, horizontalRule: MinusIcon, codeBlock: SquareCodeIcon, mermaidBlock: StructureIcon,
  html: SquareCodeIcon, webEmbed: GlobeIcon, file: PaperclipIcon };

/** `/` 목록. 묶음 순서대로 보인다. */
export const COMMANDS: BlockCommand[] = [
  { id: 'paragraph', label: '텍스트', group: '기본 블록', hint: '일반 텍스트로 작성' },
  ...HEADING_LEVELS.map(level => ({ id: `heading${level}` as const, label: `제목 ${level}`, group: '기본 블록', hint: HEADING_HINTS[level] })),
  { id: 'bulletList', label: '글머리 기호 목록', group: '기본 블록', hint: '순서 없는 목록' },
  { id: 'orderedList', label: '번호 매기기 목록', group: '기본 블록', hint: '순서 있는 목록' },
  { id: 'taskList', label: '할 일 목록', group: '기본 블록', hint: '완료를 표시하는 체크리스트' },
  { id: 'blockquote', label: '인용', group: '기본 블록', hint: '다른 목소리를 인용' },
  { id: 'table', label: '표', group: '기본 블록', hint: '행과 열로 정리' },
  { id: 'horizontalRule', label: '구분선', group: '기본 블록', hint: '내용 사이의 경계' },
  { id: 'codeBlock', label: '코드', group: '기본 블록', hint: '코드와 서식 없는 텍스트' },
  { id: 'mermaidBlock', label: 'Mermaid 다이어그램', group: '고급 블록', hint: '흐름도·시퀀스·관계도' },
  { id: 'html', label: 'HTML 임베드', group: '미디어', hint: 'HTML 파일을 본문에 미리보기로' },
  { id: 'webEmbed', label: '링크 카드', group: '미디어', hint: '웹 주소를 제목·설명·사진 카드로' },
  { id: 'file', label: '이미지 · 동영상 · 오디오 · 파일', group: '미디어', hint: '최대 10MB' },
];

/** `/` 명령으로 블록을 넣는다. 파일·HTML 임베드는 RichEditor가 올리는 칸을 띄운다. */
export function insertBlock(editor: Editor, id: CommandId, range?: { from: number; to: number }) {
  if (range) editor.chain().focus().deleteRange(range).run();
  const chain = editor.chain().focus();
  if (id === 'mermaidBlock' || id === 'webEmbed') return chain.insertContent({ type: id }).run();
  if (id === 'paragraph') return chain.setParagraph().run();
  if (id.startsWith('heading')) return chain.setHeading({ level: Number(id.slice(-1)) as HeadingLevel }).run();
  if (id === 'bulletList') return chain.toggleBulletList().run();
  if (id === 'orderedList') return chain.toggleOrderedList().run();
  if (id === 'taskList') return chain.toggleTaskList().run();
  if (id === 'blockquote') return chain.toggleBlockquote().run();
  if (id === 'codeBlock') return chain.toggleCodeBlock().run();
  if (id === 'horizontalRule') return chain.setHorizontalRule().run();
  if (id === 'table') return chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  return false;
}
