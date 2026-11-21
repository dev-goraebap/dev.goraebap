import {Node,mergeAttributes} from '@tiptap/core';
export type RichKind='mathBlock'|'inlineMath'|'mermaidBlock'|'webEmbed';
export const examples:Record<RichKind,string>={mathBlock:'E = mc^2',inlineMath:'x^2',mermaidBlock:'flowchart LR\n  A[생각] --> B[문서]\n  B --> C[공유]',webEmbed:''};
export function richNode(kind:RichKind){const inline=kind==='inlineMath';return Node.create({name:kind,group:inline?'inline':'block',inline,atom:true,selectable:true,draggable:!inline,
 addAttributes(){return {...(kind==='webEmbed'?{width:{default:100,parseHTML:(e:HTMLElement)=>Number(e.getAttribute('data-width'))||100,renderHTML:(a:Record<string,unknown>)=>({'data-width':a.width,style:`width:${Math.min(100,Math.max(25,Number(a.width)||100))}%`})}}:{}),source:{default:examples[kind],parseHTML:element=>element.getAttribute('data-source')??element.textContent??'',renderHTML:attrs=>({'data-source':attrs.source})}};},
 parseHTML:()=>[{tag:`${inline?'span':'figure'}[data-rich-type="${kind}"]`}],
 renderHTML:({HTMLAttributes})=>[inline?'span':'figure',mergeAttributes(HTMLAttributes,{'data-rich-type':kind}),[inline?'span':'pre',{},String(HTMLAttributes['data-source']??'')]],
});}
export const richNodeSpecs=(['mathBlock','inlineMath','mermaidBlock','webEmbed'] as RichKind[]).map(richNode);
