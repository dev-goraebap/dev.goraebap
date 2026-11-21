import {topLayer} from './floating';
import {CommentLayer} from './CommentLayer';
import {captureTextAnchor,captureBlockAnchor,mapThreadAnchors,type CommentBindings,type CommentRequest,type CommentAnchor} from './comments';
import {BlockMenu,copyBlocks} from './BlockMenu';
import {SelectionMenu} from './SelectionMenu';
import type {LinkChoice} from './menus';
import {openUploadZone,uploadZoneKey,uploadZonePos} from './upload-zone';
import {TableControls} from './TableControls';
import {useUploads,type UploadFile} from './uploads';
import {componentNodeViews} from './component-nodes';
import {richNodeViews} from './rich-nodes';
import {useCallback,useEffect,useLayoutEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import type {AnyExtension} from '@tiptap/core';
import {createPortal} from 'react-dom';
import {EditorContent,useEditor,type Editor} from '@tiptap/react';
import {BubbleMenu} from '@tiptap/react/menus';
import {Plugin,PluginKey,Selection,TextSelection} from '@tiptap/pm/state';
import {CellSelection} from '@tiptap/pm/tables';
import {Decoration,DecorationSet} from '@tiptap/pm/view';
import {closeHistory,isHistoryTransaction} from '@tiptap/pm/history';
import {GripVertical,Type,Heading1,Heading2,Heading3,Heading4,List,ListOrdered,ListTodo,ChevronRight,MessageSquare,Quote,Table2,Minus,SquareCode,Sigma,Workflow,Globe,Paperclip,Columns2,CornerDownLeft,ArrowUpDown} from './icons';
import {studioExtensions,insertBlock,commands,prepareDocument} from './schema';
import {tsvTableHTML} from './clipboard';
import type {JSONNode} from './model';
import {blockTree,selectionRoots,blockMove,destinationError,siblingStep,type TreeBlock,type BlockContainer,type Destination} from './block-tree';

const selectionKey=new PluginKey<string[]>('studioBlockSelection');

type BlockInfo=TreeBlock&{size:number;top:number;left:number;width:number;type:string;gripTop?:number};
type ContainerInfo=BlockContainer&{top:number;left:number;width:number;bottom:number};
type DropInfo={destination:Destination;top:number;left:number;width:number;inside:boolean;label:string;error?:string};
type Props={/** 표 열의 최소 폭(px, 인쇄 화면은 낮춘다). */tableMinWidth?:number;/** 덧붙일 Tiptap 확장(페이지 나누기 등). 처음 만들 때만 쓴다: 바꾸려면 호스트가 key를 바꾼다. */extensions?:AnyExtension[];/** 본문(EditorContent)을 감쌀 틀(종이 틀 등). 블록 조작·메뉴는 틀 바깥에 둔다. */frame?:(content:ReactNode)=>ReactNode;/** 링크 입력 칸에서 이름으로 찾아 걸 수 있는 문서들. */links?:LinkChoice[];label?:string;body:JSONNode;editable:boolean;onChange:(body:JSONNode,anchors?:Record<string,CommentAnchor>)=>void;comments?:CommentBindings;onReady?:(editor:Editor)=>void;onUpload:UploadFile;isMarkdownDraft?:boolean;onUploadPendingChange?:(pending:boolean)=>void};
type Slash={from?:number;to?:number;query:string;left:number;top:number};

const markdownCommands = commands.filter(command=>command.id!=='heading1').filter(command =>
  (command.group === '기본 블록' && command.id !== 'toggle') || ['mathBlock', 'mermaidBlock', 'file'].includes(command.id));
function matchingCommands(query:string,isMarkdownDraft?:boolean){const filtered=(isMarkdownDraft?markdownCommands:commands).filter(c=>(c.label+' '+c.id).toLowerCase().includes(query.toLowerCase()));return [...new Set(commands.map(c=>c.group))].flatMap(group=>filtered.filter(c=>c.group===group));}
const commandIcons:Record<string,typeof Type>={paragraph:Type,heading1:Heading1,heading2:Heading2,heading3:Heading3,heading4:Heading4,bulletList:List,orderedList:ListOrdered,taskList:ListTodo,toggle:ChevronRight,callout:MessageSquare,blockquote:Quote,table:Table2,horizontalRule:Minus,codeBlock:SquareCode,mathBlock:Sigma,inlineMath:Sigma,mermaidBlock:Workflow,webEmbed:Globe,file:Paperclip};

/** Whether the editor's view is on the page now: not before it mounts, nor while a Suspense boundary over it hides it (cowork). */
const hasView=(editor:Editor|null):editor is Editor=>{if(!editor||!editor.isInitialized||editor.isDestroyed)return false;try{return editor.view.dom.isConnected;}catch{return false;}};
/**
 * 본문 안의 댓글(글을 골라 다는 댓글, 블록 메뉴의 댓글, 문서 댓글 단추)을 화면에 둘지. 지금은 화면에서만 감춘다: 저장된 댓글과
 * 서버 기능은 그대로이고, true로 되돌리면 다시 보인다.
 */
const INLINE_COMMENTS=false;
export function EditorSurface({label='문서 본문',body,editable,onChange,onReady,onUpload,onUploadPendingChange,comments,isMarkdownDraft,links,extensions,frame,tableMinWidth}:Props){
 const commentRef=useRef(comments);commentRef.current=comments;
 const [commentRequest,setCommentRequest]=useState<CommentRequest|null>(null);
 const initial=useRef<JSONNode|null>(null);if(!initial.current)initial.current=prepareDocument(body);
 const host=useRef<HTMLDivElement>(null),fileInput=useRef<HTMLInputElement>(null),change=useRef(onChange);change.current=onChange;
 const [blocks,setBlocks]=useState<BlockInfo[]>([]),[selected,setSelected]=useState<string[]>([]),[context,setContext]=useState<string|null>(null),[slash,setSlash]=useState<Slash|null>(null),[active,setActive]=useState(0),[refresh,setRefresh]=useState(0),[error,setError]=useState(''),[drop,setDrop]=useState<DropInfo|null>(null);
 const palette=useRef<HTMLDivElement>(null),menuRef=useRef<HTMLDivElement>(null),bubble=useRef<HTMLDivElement>(null);const [paletteBox,setPaletteBox]=useState({left:0,top:0,maxHeight:380}),[contextBox,setContextBox]=useState({left:0,top:0}),[hovered,setHovered]=useState<string|null>(null),[isDragging,setIsDragging]=useState(false);
 const slashRef=useRef(slash);slashRef.current=slash;const activeRef=useRef(active);activeRef.current=active;const suppressed=useRef<string|null>(null);
 const [containers,setContainers]=useState<ContainerInfo[]>([]);const skipClick=useRef(false);
 const selectedRef=useRef(selected);selectedRef.current=selected;const dragging=useRef<{ids:string[];x:number;y:number;active:boolean}|null>(null);
 // 글자마다 모든 블록의 위치를 재면 긴 문서(500여 블록)에서 입력이 끊긴다: 블록 조작 단추 자리는 입력이 멈춘 뒤 잰다.
 const measureTimer=useRef(0),measureRef=useRef<(editor:Editor)=>void>(()=>undefined);
 const measureSoon=useRef((editor:Editor)=>{window.clearTimeout(measureTimer.current);measureTimer.current=window.setTimeout(()=>measureRef.current(editor),600);});
 useEffect(()=>()=>window.clearTimeout(measureTimer.current),[]);
 const measure=useCallback((editor:Editor)=>{
   // An editor not yet on the page (or shown again, as in a dialog) has no view to measure yet (cowork).
   const box=host.current?.getBoundingClientRect();if(!box||!hasView(editor))return;const list:BlockInfo[]=[];
   const tree=blockTree(editor.state.doc);
   for (const block of tree.blocks) {
     const dom = editor.view.nodeDOM(block.pos);
     if (!(dom instanceof HTMLElement) || dom.parentElement?.closest('details:not([open])')) continue;
     const rect = dom.getBoundingClientRect();
     if (!rect.width || !rect.height) continue;
     // Text blocks can be taller than their first line. Align the grip with the first caret, not the block box.
     const line = block.node.isTextblock ? editor.view.coordsAtPos(block.pos + 1) : undefined;
     const gripTop = line ? (line.top + line.bottom) / 2 - box.top : undefined;
     list.push({ ...block, size: block.node.nodeSize, top: rect.top - box.top, left: rect.left - box.left,
       width: rect.width, type: block.node.type.name, gripTop });
   }
   setBlocks(list);const targets:ContainerInfo[]=[];for(const container of tree.containers){const dom=container.id==='root'?editor.view.dom:editor.view.nodeDOM(container.pos);if(dom instanceof HTMLElement){const rect=dom.getBoundingClientRect();if(rect.width&&rect.height&&!dom.parentElement?.closest('details:not([open])'))targets.push({...container,top:rect.top-box.top,left:rect.left-box.left,width:rect.width,bottom:rect.bottom-box.top});}}setContainers(targets);
 },[]);
 measureRef.current=measure;
 const editor:Editor|null=useEditor({extensions:[...studioExtensions(richNodeViews,componentNodeViews,tableMinWidth),...(extensions??[])],content:initial.current,editable,
   editorProps:{scrollMargin:24,scrollThreshold:24,attributes:{class:'studio-prose','aria-label':label,'role':'textbox','aria-multiline':'true'},
     handlePaste:(_view,event):boolean=>{if(!editable)return false;if(event.clipboardData?.files.length){const files=Array.from(event.clipboardData.files);void upload(files);return true;}if(event.clipboardData?.getData('text/html'))return false;const html=tsvTableHTML(event.clipboardData?.getData('text/plain')??'');return html?editor?.commands.insertContent(html)??false:false;},
     handleKeyDown:(_view,event):boolean=>{
       const menu=slashRef.current;if(event.isComposing||editor?.view.composing)return false;
       // A click can move the browser caret before its selectionchange reaches ProseMirror.
       // Tab must act on the cell visibly containing that caret, not the preceding cell.
       if(_view.editable&&event.key==='Tab'&&!event.ctrlKey&&!event.metaKey&&!event.altKey){
         const dom=_view.dom.ownerDocument.getSelection();
         if(!(_view.state.selection instanceof CellSelection)&&dom?.isCollapsed&&dom.focusNode&&_view.dom.contains(dom.focusNode)&&(dom.focusNode.nodeType===1?dom.focusNode as Element:dom.focusNode.parentElement)?.closest('td,th')){
           const head=_view.posAtDOM(dom.focusNode,dom.focusOffset),resolved=_view.state.doc.resolve(head);
           if(resolved.parent.inlineContent&&_view.state.selection.head!==head)_view.dispatch(_view.state.tr.setSelection(TextSelection.create(_view.state.doc,head)).setMeta('addToHistory',false));
         }
       }
       if(_view.editable&&event.ctrlKey&&!event.altKey&&!event.metaKey&&['Home','End'].includes(event.key)){const edge=event.key==='End'?Selection.atEnd(_view.state.doc):Selection.atStart(_view.state.doc);const selection=event.shiftKey?TextSelection.between(_view.state.doc.resolve(_view.state.selection.anchor),edge.$head):edge;_view.dispatch(_view.state.tr.setSelection(selection).scrollIntoView());if(menu){suppressed.current=menu.query;setSlash(null);}return true;}
       if(!menu)return false;
       const options=matchingCommands(menu.query,isMarkdownDraft);
       if(event.key==='ArrowDown'){setActive(n=>(n+1)%Math.max(1,options.length));return true;}if(event.key==='ArrowUp'){setActive(n=>(n-1+options.length)%Math.max(1,options.length));return true;}
       if(event.key==='Escape'){suppressed.current=menu.query;setSlash(null);return true;}if(event.key==='Enter'&&options[activeRef.current]){run(options[activeRef.current].id);return true;}return false;
     }},
   onUpdate:({editor:e,transaction})=>{change.current(e.getJSON() as JSONNode,commentRef.current&&!commentRef.current.readonly?mapThreadAnchors(commentRef.current.threads,transaction.before,e.state.doc,transaction.mapping,isHistoryTransaction(transaction)):undefined);measureSoon.current(e);if(transaction.getMeta('blockMove')||isHistoryTransaction(transaction)){const valid=new Set(blockTree(e.state.doc).blocks.map(b=>b.id));setSelected(prev=>prev.filter(id=>valid.has(id)));}else setSelected([]);setRefresh(n=>n+1);const {$from,empty}=e.state.selection;const text=$from.parent.textBetween(0,$from.parentOffset,'');if(!text.startsWith('/'))suppressed.current=null;if(empty&&/^\/[^\n]{0,40}$/.test(text)&&text.slice(1)!==suppressed.current){const rect=e.view.coordsAtPos($from.start()),container=host.current?.getBoundingClientRect();setSlash({from:$from.start(),to:$from.pos,query:text.slice(1),left:Math.max(0,rect.left-(container?.left??0)),top:rect.bottom-(container?.top??0)+8});setActive(0);}else setSlash(null);},
   onSelectionUpdate:()=>setRefresh(n=>n+1),
 });
 function requestComment(ids?:string[]){if(!editor||!comments||comments.readonly)return;const anchor=ids?captureBlockAnchor(editor.state.doc,ids):captureTextAnchor(editor.state.doc,editor.state.selection.from,editor.state.selection.to);if(anchor){setCommentRequest({id:crypto.randomUUID(),anchor});setContext(null);}}
 function atomic(action:()=>unknown){if(!editor)return;editor.view.dispatch(closeHistory(editor.state.tr));action();editor.view.dispatch(closeHistory(editor.state.tr));}
 function run(id:string){if(!editor)return;const range=slashRef.current;setSlash(null);suppressed.current=null;if(id==='file'||id==='html'){if(range?.from!==undefined)editor.commands.deleteRange({from:range.from,to:range.to!});openUploadZone(editor.view,id);return;}atomic(()=>insertBlock(editor,id,range?.from!==undefined?{from:range.from,to:range.to!}:undefined));}
 const uploads=useUploads(editor,onUpload,onUploadPendingChange);
 function upload(files:File[]){
  if(!files.length)return;
  // 올리는 칸이 열려 있으면 파일을 그 자리에 넣고 칸을 닫는다.
  const zone=editor?uploadZonePos(editor.state):null;
  if(editor&&zone!==null){const {doc,tr}=editor.state;editor.view.dispatch(tr.setSelection(TextSelection.near(doc.resolve(Math.min(zone,doc.content.size)))).setMeta(uploadZoneKey,{pos:null,kind:'file'}));}
  uploads.enqueue(files);
 }
 // 블록 링크(#block-…)로 열면 그 블록으로 옮겨 간다. 본문이 그려진 뒤 한 번만.
 const jumped=useRef(false);
 useEffect(()=>{
  if(jumped.current||!blocks.length)return;jumped.current=true;
  const id=window.location.hash.startsWith('#block-')?decodeURIComponent(window.location.hash.slice(7)):'';
  if(id)host.current?.querySelector(`[data-block-id="${CSS.escape(id)}"]`)?.scrollIntoView({block:'start'});
 },[blocks.length]);

 // Counts the view's mounts, so the effects that read it run again once a hidden editor is shown again (cowork).
 const [mounts,setMounts]=useState(0);
 useEffect(()=>{if(!editor)return;const count=()=>setMounts(n=>n+1);editor.on('mount',count);editor.on('create',count);return()=>{editor.off('mount',count);editor.off('create',count);};},[editor]);
 // 초기화·재마운트 뒤에만 업로드 칸을 연결한다. Suspense가 숨긴 편집기는 storage가 아직 없을 수 있다.
 useEffect(()=>{if(!hasView(editor))return;const storage=(editor.storage as unknown as {uploadZone?:{pick:(kind:'file'|'html')=>void}}).uploadZone;if(!storage)return;const pick=(kind:'file'|'html')=>{const input=fileInput.current;if(!input)return;input.accept=kind==='html'?'.html,.htm,text/html':'';input.multiple=kind!=='html';input.click();};storage.pick=pick;return()=>{if(storage.pick===pick)storage.pick=()=>undefined;};},[editor,mounts]);
 useEffect(()=>{if(!editor)return;editor.setEditable(editable);editor.setOptions({editorProps:{...editor.options.editorProps,attributes:{...editor.options.editorProps.attributes,'aria-readonly':String(!editable)}}});},[editor,editable]);
 // eslint-disable-next-line react-hooks/exhaustive-deps -- 마운트/재마운트 시점에만 onReady·초기 측정·옵저버를 붙인다.
 useEffect(()=>{if(!hasView(editor))return;measure(editor);onReady?.(editor);if(editable&&!isMarkdownDraft)change.current(editor.getJSON() as JSONNode);const resize=new ResizeObserver(()=>measure(editor));resize.observe(editor.view.dom);if(host.current)resize.observe(host.current);const update=()=>measure(editor);window.addEventListener('resize',update);return()=>{resize.disconnect();window.removeEventListener('resize',update);};},[editor,mounts]);
 useEffect(()=>{if(hasView(editor))measure(editor);},[editor,mounts,editable,error,refresh,measure]);
 useEffect(()=>{if(!hasView(editor))return;editor.registerPlugin(new Plugin<string[]>({key:selectionKey,state:{init:()=>[],apply:(tr,value)=>tr.getMeta(selectionKey)??value},props:{decorations:state=>{const roots=selectionRoots(blockTree(state.doc),selectionKey.getState(state)??[]);return DecorationSet.create(state.doc,roots.map(block=>Decoration.node(block.pos,block.pos+block.node.nodeSize,{class:'block-selected'})));}}}));return()=>{if(!editor.isDestroyed)editor.unregisterPlugin(selectionKey);};},[editor,mounts]);
 useEffect(()=>{if(!hasView(editor))return;editor.view.dispatch(editor.state.tr.setMeta(selectionKey,selected).setMeta('addToHistory',false));},[editor,mounts,selected]);
 function move(ids:string[],destination:Destination){if(!editor||!editable||!ids.length)return;const result=blockMove(editor.state,ids,destination);if(result.error){setError(result.error);return;}setError('');setContext(null);setDrop(null);if(result.transaction){editor.view.dispatch(result.transaction);editor.view.dispatch(closeHistory(editor.state.tr));}setSelected(result.ids);}
 function step(direction:number){if(!editor)return;const destination=siblingStep(blockTree(editor.state.doc),selectedRef.current,direction);if(destination)move(selectedRef.current,destination);}
 function outside():Destination|null{if(!editor)return null;const tree=blockTree(editor.state.doc),roots=selectionRoots(tree,selectedRef.current);if(!roots.length||!roots.every(b=>b.parentId===roots[0].parentId))return null;const container=tree.containers.find(c=>c.id===roots[0].parentId),owner=tree.blocks.find(b=>b.id===container?.ownerId);return owner?{containerId:owner.parentId,anchorId:owner.id,side:'after'}:null;}
 useEffect(()=>{if(!editor||!editable)return;
   const target=(x:number,y:number):DropInfo|null=>{
     const element=document.elementFromPoint(x,y);if(!element||!host.current?.contains(element))return null;const tree=blockTree(editor.state.doc),box=host.current.getBoundingClientRect();
     const inside=(containerId:string):DropInfo|null=>{const container=tree.containers.find(c=>c.id===containerId);if(!container)return null;const dom=container.id==='root'?editor.view.dom:editor.view.nodeDOM(container.pos);if(!(dom instanceof HTMLElement))return null;let rect=dom.getBoundingClientRect();if((!rect.height||dom.parentElement?.closest('details:not([open])'))&&container.ownerId){const owner=tree.blocks.find(b=>b.id===container.ownerId);const ownerDOM=owner&&editor.view.nodeDOM(owner.pos);if(ownerDOM instanceof HTMLElement)rect=ownerDOM.getBoundingClientRect();}return {destination:{containerId},top:rect.top-box.top,left:rect.left-box.left,width:rect.width,inside:true,label:container.label+' 안으로'};};
     let result:DropInfo|null=null;const zone=element.closest('[data-drop-container]');
     if(zone)result=inside(zone.getAttribute('data-drop-container')!);
     else if(element.closest('[data-studio-end]'))result={destination:{containerId:'root'},top:editor.view.dom.getBoundingClientRect().bottom-box.top,left:0,width:box.width,inside:false,label:'문서 맨 아래로'};
     else{const identified=element.closest('[data-block-id]'),id=identified?.getAttribute('data-block-id');const block=tree.blocks.find(b=>b.id===id);if(block){const dom=editor.view.nodeDOM(block.pos);if(!(dom instanceof HTMLElement))return null;const rect=dom.getBoundingClientRect();if(block.node.type.name==='toggle'&&y>rect.top+8&&y<rect.top+34){const body=tree.containers.find(c=>c.ownerId===block.id);if(body)result=inside(body.id);}if(!result){const height=['toggle','columns','callout'].includes(block.node.type.name)?Math.min(rect.height,32):rect.height;const side=y<rect.top+height/2?'before':'after';result={destination:{containerId:block.parentId,anchorId:block.id,side},top:(side==='before'?rect.top:rect.bottom)-box.top,left:rect.left-box.left,width:rect.width,inside:false,label:side==='before'?'이 블록 앞에':'이 블록 뒤에'};}}else if(id)result=inside(id);}
     if(result){const invalid=destinationError(tree,dragging.current?.ids??selectedRef.current,result.destination);if(invalid)result.error=invalid;}return result;
   };
   const motion=(event:PointerEvent)=>{const drag=dragging.current;if(!drag)return;if(Math.hypot(event.clientX-drag.x,event.clientY-drag.y)>5)drag.active=true;if(drag.active){setIsDragging(true);setContext(null);event.preventDefault();setDrop(target(event.clientX,event.clientY));if(event.clientY<90)window.scrollBy(0,-12);if(event.clientY>window.innerHeight-70)window.scrollBy(0,12);}};
   const end=(event:PointerEvent)=>{const drag=dragging.current;if(!drag?.active){dragging.current=null;setIsDragging(false);return;}const location=target(event.clientX,event.clientY);dragging.current=null;setIsDragging(false);setDrop(null);skipClick.current=true;setTimeout(()=>{skipClick.current=false;},0);if(location)move(drag.ids,location.destination);};
   const cancel=()=>{dragging.current=null;setIsDragging(false);setDrop(null);};
   const keys=(event:KeyboardEvent)=>{if(event.isComposing||event.defaultPrevented)return;if(event.key==='Escape'){const activeDrag=dragging.current?.active;cancel();setContext(null);if(!activeDrag)setSelected([]);}const element=event.target as HTMLElement;if(element.closest('input,textarea,select,[contenteditable=true]'))return;if(!selectedRef.current.length)return;
     if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();if(event.shiftKey)editor.commands.redo();else editor.commands.undo();}
     const picked=()=>selectionRoots(blockTree(editor.state.doc),selectedRef.current).map(block=>({pos:block.pos,size:block.node.nodeSize,node:block.node})).sort((a,b)=>b.pos-a.pos);
     if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='d'){event.preventDefault();atomic(()=>{for(const block of picked())editor.chain().insertContentAt(block.pos+block.size,block.node.toJSON()).run();});}
     if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='c'){event.preventDefault();void copyBlocks(editor,picked());}
     if(event.key==='Delete'||event.key==='Backspace'){event.preventDefault();atomic(()=>{for(const block of picked())editor.chain().deleteRange({from:block.pos,to:block.pos+block.size}).run();});setSelected([]);setContext(null);}
     if(event.altKey&&event.key==='ArrowUp'){event.preventDefault();step(-1);}if(event.altKey&&event.key==='ArrowDown'){event.preventDefault();step(1);}if(event.altKey&&event.key==='ArrowLeft'){event.preventDefault();const destination=outside();if(destination)move(selectedRef.current,destination);}
   };
   const scroll=()=>measure(editor);window.addEventListener('pointermove',motion,{passive:false});window.addEventListener('pointerup',end);window.addEventListener('pointercancel',cancel);window.addEventListener('keydown',keys);window.addEventListener('scroll',scroll,true);
   return()=>{window.removeEventListener('pointermove',motion);window.removeEventListener('pointerup',end);window.removeEventListener('pointercancel',cancel);window.removeEventListener('keydown',keys);window.removeEventListener('scroll',scroll,true);};
   // eslint-disable-next-line react-hooks/exhaustive-deps -- 내부 헬퍼(move/step/outside/atomic/measure)는 editor·editable·blocks 변화 시 함께 갱신된다.
 },[editor,editable,blocks]);
 useLayoutEffect(()=>{if(!slash||!editor)return;const position=()=>{const box=host.current?.getBoundingClientRect();if(!box)return;let left=box.left+slash.left,anchorTop=box.top+slash.top-8,bottom=anchorTop+8;if(slash.from!==undefined){const rect=editor.view.coordsAtPos(slash.from);left=rect.left;anchorTop=rect.top;bottom=rect.bottom+6;}const below=window.innerHeight-bottom-12,above=anchorTop-12,up=below<260&&above>below;const maxHeight=Math.max(120,Math.min(380,up?above:below));const height=Math.min(palette.current?.scrollHeight??380,maxHeight);setPaletteBox({left:Math.max(12,Math.min(left,window.innerWidth-Math.min(320,window.innerWidth-24)-12)),top:up?Math.max(12,anchorTop-height-6):Math.max(60,bottom),maxHeight});};position();window.addEventListener('scroll',position,true);window.addEventListener('resize',position);return()=>{window.removeEventListener('scroll',position,true);window.removeEventListener('resize',position);};},[slash,editor]);
 useEffect(()=>{if(slash)palette.current?.querySelector('[data-active=true]')?.scrollIntoView({block:'nearest'});},[active,slash]);
 useLayoutEffect(()=>{if(!context)return;const position=()=>{const button=host.current?.querySelector(`[data-control-block="${CSS.escape(context)}"] > button`);if(!button)return;const rect=button.getBoundingClientRect(),height=menuRef.current?.offsetHeight??160;setContextBox({left:Math.max(10,Math.min((host.current!.getBoundingClientRect().left>272?host.current!.getBoundingClientRect().left-262:rect.right+6),window.innerWidth-252)),top:Math.max(58,rect.top+height+8>window.innerHeight?rect.bottom-height:rect.top)});};position();window.addEventListener('scroll',position,true);window.addEventListener('resize',position);menuRef.current?.querySelector('button')?.focus({preventScroll:true});return()=>{window.removeEventListener('scroll',position,true);window.removeEventListener('resize',position);};},[context]);
 useEffect(()=>{const dismiss=(event:PointerEvent)=>{const target=event.target as Element;if(!palette.current?.contains(target)){if(slashRef.current){suppressed.current=slashRef.current.query;setSlash(null);}}if(!menuRef.current?.contains(target)&&!target.closest('.inline-grip'))setContext(null);};document.addEventListener('pointerdown',dismiss);return()=>document.removeEventListener('pointerdown',dismiss);},[]);
 useEffect(()=>{if(!editable){setContext(null);setSlash(null);setSelected([]);}},[editable]);
 // 블록 조작 단추(긴 문서에서 수백 개)는 위치·선택·올린 블록·메뉴가 바뀔 때만 다시 그린다: 글자마다 모두 다시 그리면 입력이 끊겼다.
 const blockControls=useMemo(()=>!editor?null:<div className="inline-block-controls" aria-label="본문 블록 조작">{blocks.map((block,index)=><div className={`block-control ${selected.includes(block.id)?'selected':''} ${hovered===block.id?'is-hovered':''} ${context===block.id?'context-open':''}`} key={block.id} style={{top:block.gripTop ?? (block.type==='columns'?block.top-22:block.top),left:block.left}} data-control-block={block.id} data-align-line={block.gripTop !== undefined || undefined}>
     <button aria-label={`${index+1}번 블록 선택`} aria-pressed={selected.includes(block.id)} className="inline-grip" title="드래그하여 이동 · 클릭하여 메뉴 · Shift/Ctrl 다중 선택" aria-haspopup="dialog" aria-expanded={context===block.id} onContextMenu={e=>{e.preventDefault();setSelected([block.id]);setContext(block.id);}} onPointerDown={e=>{if(e.button!==0)return;e.preventDefault();e.currentTarget.focus({preventScroll:true});const ids=selected.includes(block.id)?selected:[block.id];dragging.current={ids,x:e.clientX,y:e.clientY,active:false};}} onClick={e=>{if(skipClick.current)return;if(e.shiftKey&&selected.length){const from=blocks.findIndex(b=>b.id===selected[0]);setSelected(blocks.slice(Math.min(from,index),Math.max(from,index)+1).map(b=>b.id));}else if(e.ctrlKey||e.metaKey)setSelected(prev=>prev.includes(block.id)?prev.filter(id=>id!==block.id):[...prev,block.id]);else setSelected([block.id]);setContext(e.shiftKey||e.ctrlKey||e.metaKey?null:context===block.id?null:block.id);}}><GripVertical size={15}/></button>

     {context===block.id&&<div ref={element=>{menuRef.current=element;topLayer(element);}} className="block-menu" style={{position:'fixed',...contextBox}} role="dialog" aria-label="블록 메뉴" onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();setContext(null);host.current?.querySelector<HTMLButtonElement>(`[data-control-block="${CSS.escape(block.id)}"] >button`)?.focus({preventScroll:true});return;}if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();event.stopPropagation();const buttons=Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')??[]);const current=buttons.indexOf(document.activeElement as HTMLButtonElement);const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(current+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;buttons[next]?.focus();}}}><BlockMenu editor={editor} block={{id:block.id,pos:block.pos,size:block.size,type:block.type}} atomic={atomic} close={()=>setContext(null)} onStep={step} onComment={INLINE_COMMENTS&&comments&&!comments.readonly?()=>requestComment(selected.includes(block.id)?selected:[block.id]):undefined}/></div>}
   </div>)}</div>,
  // eslint-disable-next-line react-hooks/exhaustive-deps -- 블록 조작 단추는 위치·선택·호버·메뉴·댓글 상태가 바뀔 때만 다시 그린다.
  [blocks,selected,hovered,context,contextBox,editor,comments]);
 if(!editor)return null;
 let scrollParent=editor.view.dom.parentElement;while(scrollParent&&!/(auto|scroll)/.test(getComputedStyle(scrollParent).overflowY))scrollParent=scrollParent.parentElement;
 const selectionTop=Number.parseFloat(getComputedStyle(editor.view.dom).getPropertyValue('--rd-selection-top'))||12;
 // 서식 도구는 본문 칸의 좌우 안에 머문다: 창 전체를 기준으로 두면 줄 첫머리를 골랐을 때 왼쪽 메뉴 밑으로 들어가 눌리지 않았다.
 const column=host.current?.getBoundingClientRect();
 const menuPadding={top:selectionTop,bottom:84,left:Math.max(12,(column?.left??12)-8),right:Math.max(12,window.innerWidth-(column?.right??window.innerWidth)-8)};
 const options=matchingCommands(slash?.query??'',isMarkdownDraft);
 return <div className="studio-editor" ref={host} data-editable={editable || undefined} data-dragging={isDragging}
   onDragOver={event=>{if(editable&&Array.from(event.dataTransfer.types).includes('Files')){event.preventDefault();event.dataTransfer.dropEffect='copy';}}}
   onDropCapture={event=>{if(!editable||!event.dataTransfer.files.length)return;event.preventDefault();event.stopPropagation();const position=editor.view.posAtCoords({left:event.clientX,top:event.clientY})?.pos;editor.chain().focus().setTextSelection(position??editor.state.selection.from).run();upload(Array.from(event.dataTransfer.files));}}
   onPointerDownCapture={event=>{if((event.target as Element).closest('.studio-prose')){setSelected([]);setContext(null);}}} onPointerMove={event=>{/* 손잡이가 있는 가장 가까운 블록을 찾는다: 목록 항목 안의 문단처럼 손잡이가 없는 블록 위에서는 그 목록의 손잡이를 보인다. */let at=(event.target as Element).closest('[data-block-id]');while(at&&!blocks.some(block=>block.id===at!.getAttribute('data-block-id')))at=at.parentElement?.closest('[data-block-id]')??null;setHovered(at?.getAttribute('data-block-id')??null);}} onPointerLeave={()=>setHovered(null)}>
   {/* 서식 도구는 보일 때 최상위 층(topLayer)으로 올린다: Tiptap이 처음 자리를 잴 때 요소가 아직 absolute라 위치 기준(.studio-editor)만큼 어긋났고
     (페이지에서 top:-48px), 대화상자 안에서는 팝업의 transform · overflow에 갇혀 잘리고 덮개에 가려 눌리지 않았다. 최상위 층은 창이 기준이다. */}
   {editable&&<BubbleMenu editor={editor} updateDelay={0} ref={bubble} className="rd-bubble" getReferencedVirtualElement={()=>{if(!editor.isActive('table'))return null;const dom=editor.view.domAtPos(editor.state.selection.from).node;const table=(dom.nodeType===1?dom as Element:dom.parentElement)?.closest('table');if(!table)return null;return {getBoundingClientRect:()=>{const box=table.getBoundingClientRect();return DOMRect.fromRect({x:box.left,y:Math.max(150,box.top),width:box.width,height:0});}};}} shouldShow={({editor:active,state,view,element,from,to})=>active.isEditable&&state.selection instanceof TextSelection&&!state.selection.empty&&!!state.doc.textBetween(from,to).length&&(view.hasFocus()||element.contains(element.ownerDocument.activeElement)||!!element.ownerDocument.activeElement?.closest('.rd-color-palette,[data-rd-select-layer]'))} options={{onShow:()=>topLayer(bubble.current),strategy:'fixed',placement:'top',offset:10,scrollTarget:scrollParent??window,flip:{padding:menuPadding,fallbackPlacements:['bottom']},shift:{padding:menuPadding,crossAxis:true}}}><SelectionMenu editor={editor} isMarkdownDraft={isMarkdownDraft} links={links} trailing={comments&&!comments.readonly?<button type="button" className="rd-tool rd-tool-wide" aria-label="선택 텍스트에 댓글" onMouseDown={event=>event.preventDefault()} onClick={()=>requestComment()}><MessageSquare size={16}/>댓글</button>:undefined}/></BubbleMenu>}
   {editable&&<TableControls editor={editor} host={host} atomic={atomic}/>}
   {error&&<p className="studio-error" role="alert">{error}</p>}
   {uploads.panel}
   {frame?frame(<EditorContent editor={editor}/>):<EditorContent editor={editor}/>}{comments&&INLINE_COMMENTS&&<CommentLayer editor={editor} bindings={comments} request={commentRequest} editable={editable}/>}

   {editable&&blockControls}
   {editable&&(selected.length>0||drop)&&<div className="container-destinations">{containers.filter(c=>c.id!=='root').map(container=><button key={container.id} className="container-drop-zone" data-drop-container={container.id} aria-label={`${container.label} 안으로 이동`} style={{top:container.bottom-22,left:container.left+4,width:Math.max(60,container.width-8)}} onClick={()=>move(selected,{containerId:container.id})}>여기에 놓기</button>)}{blocks.filter(b=>b.type==='toggle'&&!b.node.attrs.open).map(block=>{const container=blockTree(editor.state.doc).containers.find(c=>c.ownerId===block.id);return container?<button key={block.id} className="closed-toggle-target" data-drop-container={container.id} aria-label={`${container.label} 안으로 이동`} style={{top:block.top,left:Math.max(block.left,block.left+block.width-115)}} onClick={()=>move(selected,{containerId:container.id})}>토글 안으로</button>:null;})}</div>}
   {drop&&<div className={`block-drop-line ${drop.inside?'inside':''} ${drop.error?'invalid':''}`} style={{top:drop.top,left:drop.left,width:drop.width}}><span>{drop.error??drop.label}</span></div>}
   {editable&&isDragging&&<div data-studio-end className="studio-end" aria-hidden="true" />}
   <input hidden ref={fileInput} type="file" multiple aria-label="파일 첨부" onChange={e=>{void upload(Array.from(e.target.files??[]));e.target.value='';}}/>
   {slash&&editable&&createPortal(<div ref={element=>{palette.current=element;topLayer(element);}} className="bit-rich-document-floating studio-floating command-palette" style={{...paletteBox,colorScheme:host.current?getComputedStyle(host.current).colorScheme:undefined}} role="dialog" aria-label="블록 추가 메뉴">
     <div className="command-scroll">{options.map((command,index)=><div key={command.id}>{(index===0||options[index-1].group!==command.group)&&<div className="command-group">{command.group}</div>}<button className={`command-option ${index===active?'active':''}`} data-active={index===active} onMouseDown={e=>e.preventDefault()} onMouseEnter={()=>setActive(index)} onClick={()=>run(command.id)}><span className="command-icon">{(()=>{const Icon=commandIcons[command.id]??Columns2;return <Icon size={18} strokeWidth={1.7}/>;})()}</span><span>{command.label}<small>{command.hint}</small></span></button></div>)}{!options.length&&<p className="dim">일치하는 블록이 없습니다.</p>}</div><div className="command-footer"><span><ArrowUpDown size={12}/> 이동 <CornerDownLeft size={12}/> 추가</span><button onClick={()=>{setSlash(null);editor.commands.focus();}}>닫기 <kbd>esc</kbd></button></div>
   </div>,host.current?.closest('dialog')??document.body)}
 </div>;
}
