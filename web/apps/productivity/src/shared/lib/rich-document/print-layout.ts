import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const PRINT_OPTIONS = [
  { key: 'printBreakBefore', label: '새 페이지에서 시작', description: '이 블록부터 다음 쪽에 놓습니다.' },
  { key: 'printKeepWithNext', label: '다음 블록과 함께 유지', description: '제목과 다음 설명이 서로 다른 쪽에 갈라지지 않게 합니다.' },
  { key: 'printKeepTogether', label: '블록을 나누지 않기', description: '한 문단이나 표가 쪽 중간에서 나뉘지 않게 합니다.' },
] as const;
export const printAttribute = (key: string) => `data-${key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`;
const blocks = ['paragraph', 'heading', 'blockquote', 'bulletList', 'orderedList', 'taskList', 'codeBlock', 'horizontalRule', 'table', 'toggle', 'callout', 'columns', 'media', 'mathBlock', 'mermaidBlock', 'webEmbed'];

/** 인쇄 의도를 본문·버전과 함께 저장한다. 노드뷰가 있는 표·그림·도표에도 같은 속성을 입힌다. */
export const PrintLayout = Extension.create({
  name: 'printLayout',
  addGlobalAttributes() {
    return [
      { types: blocks, attributes: Object.fromEntries(PRINT_OPTIONS.map(({ key }) => [key, {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute(printAttribute(key)) === 'true' || null,
        renderHTML: (attrs: Record<string, unknown>) => attrs[key] === true ? { [printAttribute(key)]: 'true' } : {},
      }])) },
    ];
  },
  addProseMirrorPlugins() {
    return [new Plugin({ props: { decorations(state) {
      const decorations: Decoration[] = [];
      state.doc.descendants((node, pos) => {
        if (!blocks.includes(node.type.name)) return;
        const enabled = PRINT_OPTIONS.filter(({ key }) => node.attrs[key] === true);
        if (enabled.length) decorations.push(Decoration.node(pos, pos + node.nodeSize,
          Object.fromEntries(enabled.map(({ key }) => [printAttribute(key), 'true']))));
      });
      return DecorationSet.create(state.doc, decorations);
    } } })];
  },
});
