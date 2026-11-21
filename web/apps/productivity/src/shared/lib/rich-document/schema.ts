import {PrintLayout} from './print-layout';
import {Extension,Node,mergeAttributes} from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import CodeBlock from '@tiptap/extension-code-block';
import {Table,TableKit,TableView} from '@tiptap/extension-table';
import {columnResizing} from '@tiptap/pm/tables';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import {UploadZone} from './upload-zone';
import {TaskList,TaskItem} from '@tiptap/extension-list';
import {TextStyleKit} from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import {Plugin} from '@tiptap/pm/state';
import {richNodeSpecs} from './rich-node-spec';
import type {AnyExtension,Editor} from '@tiptap/core';
import type {JSONNode} from './model';
import {Toggle,ToggleSummary,ToggleBody,ParagraphHistoryBoundary} from './toggle-spec';

export const blank={type:'doc',content:[{type:'paragraph'}]};
export function prepareDocument(value:JSONNode):JSONNode{const copy=structuredClone(value),seen=new Set<string>();if(copy.attrs?.printStartOnNewPage===true&&copy.content?.[0]){copy.content[0].attrs={...copy.content[0].attrs,printBreakBefore:true};}if(copy.attrs)delete copy.attrs.printStartOnNewPage;const types=new Set(['paragraph','heading','blockquote','bulletList','orderedList','taskList','codeBlock','horizontalRule','table','toggle','callout','columns','media','column','toggleBody','mathBlock','mermaidBlock','webEmbed']);const walk=(node:JSONNode)=>{if(types.has(node.type)){node.attrs??={};const existing=typeof node.attrs.blockId==='string'?node.attrs.blockId:'';if(!existing||seen.has(existing))node.attrs.blockId=crypto.randomUUID();seen.add(String(node.attrs.blockId));}node.content?.forEach(walk);};walk(copy);return copy;}
export const Callout=Node.create({name:'callout',group:'block',content:'block+',defining:true,addAttributes(){return {tone:{default:'gray',parseHTML:e=>e.getAttribute('data-tone')}};},parseHTML:()=>[{tag:'aside[data-callout]'}],renderHTML:({HTMLAttributes})=>['aside',mergeAttributes(HTMLAttributes,{'data-callout':'','data-tone':HTMLAttributes.tone}),0]});
const Columns=Node.create({name:'columns',group:'block',content:'column{2,5}',defining:true,addAttributes(){return {count:{default:2,parseHTML:e=>Number(e.getAttribute('data-count'))||2}};},parseHTML:()=>[{tag:'div[data-columns]'}],renderHTML:({HTMLAttributes})=>['div',mergeAttributes(HTMLAttributes,{'data-columns':'','data-count':HTMLAttributes.count,style:`--columns:${HTMLAttributes.count}`}),0]});
const Column=Node.create({name:'column',content:'block+',defining:true,isolating:true,parseHTML:()=>[{tag:'div[data-column]'}],renderHTML:({HTMLAttributes})=>['div',mergeAttributes(HTMLAttributes,{'data-column':''}),0]});
export const Media=Node.create({name:'media',group:'block',atom:true,draggable:true,
 addAttributes(){return {src:{default:'',parseHTML:e=>e.getAttribute('data-src')??''},name:{default:'첨부 파일',parseHTML:e=>e.getAttribute('data-name')??'첨부 파일'},mime:{default:'application/octet-stream',parseHTML:e=>e.getAttribute('data-mime')??'application/octet-stream'},width:{default:100,parseHTML:e=>Number(e.getAttribute('data-width'))||100},size:{default:0,parseHTML:e=>Number(e.getAttribute('data-size'))||0},color:{default:null,parseHTML:e=>e.getAttribute('data-color')},pixelWidth:{default:null,parseHTML:e=>Number(e.getAttribute('data-pixel-width'))||null},pixelHeight:{default:null,parseHTML:e=>Number(e.getAttribute('data-pixel-height'))||null}};},
 parseHTML:()=>[{tag:'figure[data-media]'}],
 renderHTML:({HTMLAttributes:a})=>{const safe=(/^(\/(?!\/)|https:\/\/|blob:)/.test(String(a.src)))?a.src:'';const child=a.mime.startsWith('image/')?['img',{src:safe,alt:a.name,loading:'lazy'}]:a.mime.startsWith('video/')?['video',{src:safe,controls:'',preload:'metadata'}]:a.mime.startsWith('audio/')?['audio',{src:safe,controls:'',preload:'metadata'}]:['a',{href:safe,download:a.name},a.name];return ['figure',mergeAttributes({'data-media':'',style:`width:${Math.min(100,Math.max(25,Number(a.width)||100))}%`,'data-name':a.name,'data-mime':a.mime,'data-src':safe,'data-width':a.width,'data-size':a.size},a.color?{'data-color':a.color}:{},a.pixelWidth&&a.pixelHeight?{'data-pixel-width':a.pixelWidth,'data-pixel-height':a.pixelHeight}:{},a.blockId?{'data-block-id':a.blockId}:{}),child,['figcaption',{},a.name]];}
});
const BlockIdentity=Extension.create({name:'blockIdentity',addGlobalAttributes(){return [{types:['paragraph','heading','blockquote','bulletList','orderedList','taskList','codeBlock','horizontalRule','table','toggle','callout','columns','media','column','toggleBody','mathBlock','mermaidBlock','webEmbed'],attributes:{blockId:{default:null,parseHTML:e=>e.getAttribute('data-block-id'),renderHTML:attrs=>attrs.blockId?{'data-block-id':attrs.blockId}:{}}}}];},
 addProseMirrorPlugins(){return [new Plugin({appendTransaction:(transactions,_old,state)=>{if(!transactions.some(tr=>tr.docChanged))return null;const seen=new Set<string>();let tr=state.tr;state.doc.descendants((node,pos)=>{if(!('blockId'in node.attrs))return;const id=node.attrs.blockId;if(!id||seen.has(id)){const next=crypto.randomUUID();tr=tr.setNodeMarkup(pos,undefined,{...node.attrs,blockId:next});seen.add(next);}else seen.add(id);});return tr.docChanged?tr.setMeta('addToHistory',false):null;}})];}
});
/**
 * 열 경계를 끌어 너비를 바꾸는 표(cowork). Tiptap의 표는 편집기가 만들어지는 순간 편집할 수 있을 때만 열 너비 조절을
 * 붙이는데, 본문은 읽기로 열렸다가 편집으로 바뀌므로 그대로 두면 한 번도 붙지 않는다. 그래서 늘 붙여 두고, 읽는 동안에는
 * 조절 기능이 스스로 쉰다(prosemirror-tables가 view.editable을 확인한다).
 */
/** 너비가 없어진 열의 <col>에서 옛 너비를 지운다. Tiptap의 TableView는 너비를 쓰기만 하고 지우지 않아, 너비 조절을 실행 취소해도 화면의 열이 그대로였다. */
class SyncedTableView extends TableView{
 update(node:Parameters<TableView['update']>[0]){if(!super.update(node))return false;let index=0;
  node.firstChild?.forEach(cell=>{const widths=cell.attrs.colwidth as number[]|null;for(let span=0;span<(cell.attrs.colspan||1);span++,index++){const col=this.colgroup.children[index] as HTMLElement|undefined;if(col&&!widths?.[span])col.style.removeProperty('width');}});
  return true;}
}
const ResizableTable=Table.extend({
 addProseMirrorPlugins(){const base=this.parent?.()??[];if(!this.options.resizable||this.editor.isEditable)return base;
  return [columnResizing({handleWidth:this.options.handleWidth,cellMinWidth:this.options.cellMinWidth,defaultCellMinWidth:this.options.cellMinWidth,View:this.options.View,lastColumnResizable:this.options.lastColumnResizable}),...base];},
 addNodeView(){return this.options.resizable?null:this.parent?.()??null;},
});
/** cellMinWidth: 표 열의 최소 폭(px). 인쇄 화면은 낮춰, 종이 폭에 맞춰 줄인 열 폭(출력용 사본의 colwidth)이 그대로 쓰이게 한다. */
export function studioExtensions(richNodes:AnyExtension[]=richNodeSpecs,componentNodes:AnyExtension[]=[Callout,CodeBlock,Media],cellMinWidth=120){return [PrintLayout,StarterKit.configure({codeBlock:false,heading:{levels:[2,3,4]},link:{openOnClick:false,defaultProtocol:'https',HTMLAttributes:{rel:'noopener noreferrer',target:'_blank'}}}),TableKit.configure({table:false}),ResizableTable.configure({resizable:true,cellMinWidth,View:SyncedTableView}),TaskList,TaskItem.configure({nested:true}),TextStyleKit,Highlight.configure({multicolor:true}),TextAlign.configure({types:['heading','paragraph']}),Subscript,Superscript,UploadZone,Toggle,ToggleSummary,ToggleBody,ParagraphHistoryBoundary,...componentNodes,Columns,Column,...richNodes,BlockIdentity];}
export const commands=[
 {id:'paragraph',label:'텍스트',group:'기본 블록',icon:'T',hint:'일반 텍스트로 작성'},
 ...[2,3,4].map(level=>({id:`heading${level}`,label:`제목 ${level}`,group:'기본 블록',icon:`H${level}`,hint:['큰 제목','중간 제목','작은 제목','작은 구획 제목'][level-1]})),
 {id:'bulletList',label:'글머리 기호 목록',group:'기본 블록',icon:'•',hint:'순서 없는 목록'},
 {id:'orderedList',label:'번호 매기기 목록',group:'기본 블록',icon:'1.',hint:'순서 있는 목록'},
 {id:'taskList',label:'할 일 목록',group:'기본 블록',icon:'☑',hint:'완료를 표시하는 체크리스트'},
 {id:'toggle',label:'토글 목록',group:'기본 블록',icon:'▸',hint:'접을 수 있는 내용'},
 {id:'callout',label:'콜아웃',group:'기본 블록',icon:'!',hint:'눈에 띄는 안내와 메모'},
 {id:'blockquote',label:'인용',group:'기본 블록',icon:'❞',hint:'다른 목소리를 인용'},
 {id:'table',label:'표',group:'기본 블록',icon:'▦',hint:'행과 열로 정리'},
 {id:'horizontalRule',label:'구분선',group:'기본 블록',icon:'—',hint:'내용 사이의 경계'},
 {id:'codeBlock',label:'코드',group:'기본 블록',icon:'</>',hint:'코드와 서식 없는 텍스트'},
 {id:'mathBlock',label:'수식 블록',group:'고급 블록',icon:'∑',hint:'LaTeX 수식을 한 블록으로'},
 {id:'inlineMath',label:'인라인 수식',group:'인라인',icon:'√',hint:'문장 안에 LaTeX 수식'},
 {id:'mermaidBlock',label:'Mermaid 다이어그램',group:'고급 블록',icon:'◇',hint:'흐름도·시퀀스·관계도'},
 {id:'html',label:'HTML 임베드',group:'미디어',icon:'</>',hint:'HTML 파일을 본문에 미리보기로'},
 {id:'webEmbed',label:'링크 카드',group:'미디어',icon:'↗',hint:'웹 주소를 제목·설명·사진 카드로'},
 {id:'file',label:'이미지 · 동영상 · 오디오 · 파일',group:'미디어',icon:'↥',hint:'최대 10MB, 로컬 서버에 보관'},
 ...[2,3,4,5].map(count=>({id:`columns${count}`,label:`${count}개의 열`,group:'고급 블록',icon:'▥',hint:'내용을 나란히 배치'})),
];
export function insertBlock(editor:Editor,id:string,range?:{from:number;to:number}){
 if(range)editor.chain().focus().deleteRange(range).run();
 const chain=editor.chain().focus();
 if(['mathBlock','inlineMath','mermaidBlock','webEmbed'].includes(id))return chain.insertContent({type:id}).run();
 if(id==='paragraph')return chain.setParagraph().run();
 if(id.startsWith('heading'))return chain.setHeading({level:Number(id.slice(-1)) as 2|3|4}).run();
 if(id==='bulletList')return chain.toggleBulletList().run();if(id==='orderedList')return chain.toggleOrderedList().run();if(id==='taskList')return chain.toggleTaskList().run();
 if(id==='blockquote')return chain.toggleBlockquote().run();if(id==='codeBlock')return chain.toggleCodeBlock().run();if(id==='horizontalRule')return chain.setHorizontalRule().run();if(id==='table')return chain.insertTable({rows:3,cols:3,withHeaderRow:true}).run();
 if(id==='toggle')return chain.insertContent({type:'toggle',attrs:{open:true},content:[{type:'toggleSummary',content:[{type:'text',text:'토글 제목'}]},{type:'toggleBody',content:[{type:'paragraph'}]}]}).run();
 if(id==='callout')return chain.insertContent({type:'callout',content:[{type:'paragraph',content:[{type:'text',text:'기억할 내용을 적어 보세요.'}]}]}).run();
 if(id.startsWith('columns'))return chain.insertContent({type:'columns',attrs:{count:Number(id.slice(-1))},content:Array.from({length:Number(id.slice(-1))},()=>({type:'column',content:[{type:'paragraph'}]}))}).run();
}
