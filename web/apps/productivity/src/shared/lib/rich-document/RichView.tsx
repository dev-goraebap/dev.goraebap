import {LinkCard} from './LinkCard';
import {useEffect,useRef,useState} from 'react';
import {NodeViewWrapper,type NodeViewProps} from '@tiptap/react';
import {closeHistory} from '@tiptap/pm/history';
import {Button} from './Button';
import {SourceArea} from './SourceArea';
import {Globe,Pencil,Search} from './icons';
import {diagramSlide,openZoom} from '@/shared/ui/zoom-viewer';
import {BlockCopy} from './block-ui';
import {embedURL} from './embed';
import {examples,type RichKind} from './rich-node-spec';
import {labels,usePreview,diagramBackground} from './rich-nodes';
export function RichView({node,editor,updateAttributes,getPos,selected}:NodeViewProps){
 const kind=node.type.name as RichKind,inline=kind==='inlineMath',source=String(node.attrs.source??''),label=labels[kind];
 const [editing,setEditing]=useState(false),[draft,setDraft]=useState(source),[editable,setEditable]=useState(editor.isEditable);
 const textarea=useRef<HTMLTextAreaElement>(null),address=useRef<HTMLInputElement>(null),previewBox=useRef<HTMLDivElement>(null);const preview=usePreview(kind,editing?draft:source,previewBox);
 useEffect(()=>{const update=()=>setEditable(editor.isEditable);editor.on('transaction',update);editor.on('update',update);update();return()=>{editor.off('transaction',update);editor.off('update',update);};},[editor]);
 const editableRef=useRef(editor.isEditable);editableRef.current=editor.isEditable;
 useEffect(()=>{setEditing(editableRef.current&&!source.trim());setDraft(source);},[source]);
 useEffect(()=>{if(!editable)setEditing(false);},[editable]);
 useEffect(()=>{if(editing)(textarea.current??address.current)?.focus();},[editing]);
 const start=()=>{if(!editable)return;setDraft(source);setEditing(true);};
 // 도표를 크게 보기 창으로 연다(지금 화면 색표의 바탕을 깐 채로).
 const zoom=()=>{const svg=previewBox.current?.querySelector('svg');const scheme=getComputedStyle(document.documentElement).colorScheme.includes('dark')?'dark':'light';const slide=diagramSlide(svg,diagramBackground(scheme),`${label} 크게 보기`);if(slide)openZoom(slide);};
 // 취소: 아직 주소가 없는 새 링크 카드는 빈 블록을 남기지 않고 지운다.
 const cancel=()=>{const pos=getPos();if(kind==='webEmbed'&&!source.trim()&&typeof pos==='number'){editor.chain().focus().deleteRange({from:pos,to:pos+node.nodeSize}).run();return;}setDraft(source);setEditing(false);editor.commands.focus();};
 const apply=()=>{if(!editable||preview.pending||preview.error)return;editor.view.dispatch(closeHistory(editor.state.tr));updateAttributes({source:draft.trim()});editor.view.dispatch(closeHistory(editor.state.tr));setEditing(false);const pos=getPos();if(typeof pos==='number')editor.chain().focus().setNodeSelection(pos).run();};
 let embed:ReturnType<typeof embedURL>|null=null;if(kind==='webEmbed'&&!preview.error&&!preview.pending){try{embed=embedURL(editing?draft:source);}catch{/* 주소가 틀리면 미리보기 없이 둔다. */}}
 const render=()=>preview.pending?<span className="rich-loading" role="status">미리보기 만드는 중…</span>:preview.error?<span className="rich-render-error" role="alert">{label}를 표시할 수 없습니다. <span>{preview.error}</span></span>:kind==='webEmbed'&&embed?<LinkCard url={embed.original} host={embed.host} editable={editable} onEdit={start}/>:<span className={`rich-render ${kind==='mermaidBlock'?'mermaid-render':''}`} data-rendered={kind} dangerouslySetInnerHTML={{__html:preview.html}}/>;
 return <NodeViewWrapper as={inline?'span':'div'} className={`rich-node rich-${kind} ${selected&&editable?'rich-selected':''}`} data-rich-type={kind} data-block-id={node.attrs.blockId??undefined} contentEditable={false}>
   {kind==='mermaidBlock'&&<span className="media-tools">{!editing&&!preview.pending&&!preview.error&&<Button aria-label="다이어그램 크게 보기" title="크게 보기" onClick={zoom}><Search size={14}/></Button>}<BlockCopy text={source} label="Mermaid 원문 복사"/>{editable&&!editing&&<Button aria-label={`${label} 편집`} title="편집" onClick={start}><Pencil size={14}/></Button>}</span>}
   {kind==='webEmbed'&&editing?null:inline?<span className="inline-formula" role={editable?'button':undefined} tabIndex={editable?0:undefined} aria-label={editable?'인라인 수식 편집':`수식 ${source}`} onDoubleClick={start} onClick={start} onKeyDown={event=>{if(event.key==='Enter'&&!event.nativeEvent.isComposing){event.preventDefault();start();}}}>{render()}</span>:<div ref={previewBox} className={`rich-preview${kind==='mermaidBlock'&&!editable?' rich-zoomable':''}`} onDoubleClick={kind==='mermaidBlock'&&!editable?zoom:kind==='webEmbed'?undefined:start}>{render()}</div>}
   {editable&&!editing&&!inline&&kind!=='mermaidBlock'&&kind!=='webEmbed'&&<span className="rich-actions"><Button aria-label={`${label} 편집`} onClick={start}><Pencil size={13}/>편집</Button></span>}
   {editable&&editing&&kind==='webEmbed'&&<span className="rd-upload-zone rd-embed-zone" data-rich-editor role="group" aria-label="링크 카드 주소 넣기">
     <span className="rd-upload-art"><Globe size={22}/></span>
     <span className="rd-upload-text">카드로 보여 줄 웹 페이지 주소를 붙여 넣으세요</span>
     <input ref={address} className="rd-embed-input" type="url" inputMode="url" value={draft} placeholder="https://" aria-label="웹 주소" spellCheck={false}
      onChange={event=>setDraft(event.target.value)} onKeyDown={event=>{if(event.nativeEvent.isComposing)return;if(event.key==='Escape'){event.preventDefault();event.stopPropagation();cancel();}if(event.key==='Enter'){event.preventDefault();event.stopPropagation();apply();}}}/>
     <span className="rd-upload-hint" role={draft.trim()&&preview.error?'alert':undefined}>{draft.trim()&&preview.error?preview.error:'그 페이지의 제목·설명·대표 사진을 카드로 보여 줍니다 · HTTPS 주소만 · Enter 넣기 · Esc 취소'}</span>
     <span className="rd-embed-actions"><Button onClick={cancel}>취소</Button><Button primary disabled={!draft.trim()||preview.pending||!!preview.error} onClick={apply}>넣기</Button></span>
   </span>}
   {editable&&editing&&kind!=='webEmbed'&&<span className={`rich-source-editor ${inline?'inline-source-editor':''}`} data-rich-editor role="group" aria-label={`${label} 원문 편집`}>
     <label>{kind==='mermaidBlock'?'Mermaid 원문':'LaTeX 수식'}</label>
     <SourceArea ref={textarea} aria-label={`${label} 원문`} value={draft} rows={kind==='mermaidBlock'?6:3} maxLength={30000} placeholder={examples[kind]} onChange={event=>setDraft(event.target.value)} onKeyDown={event=>{if(event.nativeEvent.isComposing)return;if(event.key==='Escape'){event.preventDefault();event.stopPropagation();cancel();}if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();event.stopPropagation();apply();}}}/>
     <span className="rich-editor-footer"><span>Ctrl+Enter 적용 · Esc 취소</span><Button onClick={cancel}>취소</Button><Button primary disabled={preview.pending||!!preview.error} onClick={apply}>적용</Button></span>
   </span>}
   {!editing&&preview.error&&<span className="rich-source-fallback">{source||`${label}를 편집해 주세요.`}</span>}
 </NodeViewWrapper>;
}
