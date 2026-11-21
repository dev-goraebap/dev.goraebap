import {Node,Extension,mergeAttributes} from '@tiptap/core';
import {closeHistory} from '@tiptap/pm/history';
export const Toggle = Node.create({
  name: 'toggle', group: 'block', content: 'toggleSummary toggleBody', defining: true,
  addAttributes() { return { open: { default: true, parseHTML: element => element.hasAttribute('open'), renderHTML: attrs => attrs.open ? {open: ''} : {} } }; },
  parseHTML() { return [{tag:'details'}]; },
  renderHTML({HTMLAttributes}) { return ['details', mergeAttributes(HTMLAttributes, {'data-toggle': ''}), 0]; },
  addNodeView() {
    return ({node, editor, getPos}) => {
      let current = node;
      const dom = document.createElement('details'); dom.dataset.toggle = ''; if(current.attrs.blockId)dom.dataset.blockId=current.attrs.blockId; dom.open = current.attrs.open;
      const sync = () => {
        if (dom.open === current.attrs.open) return;
        const pos = getPos();
        if (typeof pos === 'number') editor.view.dispatch(editor.state.tr.setNodeMarkup(pos, undefined, {...current.attrs, open:dom.open}).setMeta('addToHistory', false));
      };
      dom.addEventListener('toggle', sync);
      return {dom, contentDOM:dom, update(next) {if (next.type !== current.type) return false; current=next; if(next.attrs.blockId)dom.dataset.blockId=next.attrs.blockId;else delete dom.dataset.blockId; if (dom.open !== next.attrs.open) dom.open=next.attrs.open; return true;}, ignoreMutation(mutation) {return mutation.type==='attributes' && mutation.target===dom;}, destroy() {dom.removeEventListener('toggle',sync);} };
    };
  },
});
export const ToggleSummary = Node.create({name:'toggleSummary', content:'inline*', defining:true, parseHTML:()=>[{tag:'summary'}], renderHTML:()=>['summary',0]});
export const ToggleBody = Node.create({name:'toggleBody', content:'block+', defining:true, parseHTML:()=>[{tag:'div[data-toggle-body]'}], renderHTML:({HTMLAttributes})=>['div',mergeAttributes(HTMLAttributes,{'data-toggle-body':''}),0]});

// Product policy: a new paragraph starts a new undo group. Baseline StarterKit
// merges an immediately committed composition + Enter + typing in the CDP probe.
export const ParagraphHistoryBoundary = Extension.create({
  name:'paragraphHistoryBoundary',priority:1100,
  addKeyboardShortcuts(){return {Enter:()=>{this.editor.view.dispatch(closeHistory(this.editor.state.tr));return false;}};},
});

