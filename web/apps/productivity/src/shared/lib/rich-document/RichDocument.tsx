import type {AnyExtension} from '@tiptap/core';
import type {Editor} from '@tiptap/react';
import type {ReactNode} from 'react';
import type {CommentAnchor,CommentBindings} from './comments';
import {EditorSurface} from './EditorSurface';
import type {JSONNode} from './model';
import type {UploadFile} from './uploads';
import type {LinkChoice} from './menus';
import 'katex/dist/katex.min.css';
import './styles.css';
export type RichDocumentProps={documentId:string;label?:string;value:JSONNode;mode:'read'|'edit';onChange:(body:JSONNode,anchors?:Record<string,CommentAnchor>)=>void;comments?:CommentBindings;upload?:UploadFile;onUploadPendingChange?:(pending:boolean)=>void;isMarkdownDraft?:boolean;font?:'default'|'serif'|'mono';/** 링크 입력 칸에서 이름으로 찾아 걸 수 있는 문서들. */links?:LinkChoice[];/** 덧붙일 확장(페이지 나누기 등). 바꾸려면 documentId를 바꾼다. */extensions?:AnyExtension[];/** 본문을 감쌀 틀(종이 틀 등). */frame?:(content:ReactNode)=>ReactNode;/** 에디터가 준비되면 부른다(서식 막대 등이 쓴다). */onReady?:(editor:Editor)=>void;/** 표 열의 최소 폭(px). 인쇄 화면은 낮춘다. */tableMinWidth?:number;};
const noUpload:UploadFile=async()=>{throw Error('이 화면에는 첨부 저장소가 연결되지 않았습니다.');};
/** value is the initial snapshot for documentId; change documentId for load/restore. Mode changes preserve Undo. */
export function RichDocument({documentId,label,value,mode,onChange,upload=noUpload,onUploadPendingChange,font='default',comments,isMarkdownDraft,links,extensions,frame,onReady,tableMinWidth}:RichDocumentProps){
 return <div className="bit-rich-document"><div className={`studio-shell ${font==='serif'?'font-serif':font==='mono'?'font-mono':''}`}><EditorSurface tableMinWidth={tableMinWidth} key={documentId} label={label} body={value} editable={mode==='edit'} isMarkdownDraft={isMarkdownDraft} onChange={onChange} onUpload={upload} onUploadPendingChange={onUploadPendingChange} comments={comments} links={links} extensions={extensions} frame={frame} onReady={onReady}/></div></div>;
}
