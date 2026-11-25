import {useEffect,useRef,useState} from 'react';
import type {Editor} from '@tiptap/react';
import {Button} from '@goraebap/ui-react/compact/button';
import {Dialog,DialogContent,DialogFooter,DialogHeader,DialogTitle} from '@goraebap/ui-react/compact/dialog';
import {Textarea} from '@goraebap/ui-react/components/textarea';
import type {CommentAnchor} from './comments';

/** 문장 · 블록에 댓글을 쓰는 작은 창. 닫으면 연 자리(없으면 본문)로 초점을 돌린다. Ctrl/⌘+Enter로 등록한다. */
export function CommentComposer({anchor,editor,onCancel,onSubmit}:{anchor:CommentAnchor;editor:Editor;onCancel:()=>void;onSubmit:(body:string)=>void}){
 const [body,setBody]=useState(''),previous=useRef(document.activeElement instanceof HTMLElement?document.activeElement:null);
 useEffect(()=>()=>{queueMicrotask(()=>{const element=previous.current?.isConnected?previous.current:editor.view.dom;if(element.isConnected)element.focus({preventScroll:true});});},[editor]);
 const submit=()=>{if(body.trim())onSubmit(body.trim());};
 return <Dialog open onOpenChange={open=>{if(!open)onCancel();}}>
  <DialogContent finalFocus={false}>
   <DialogHeader><DialogTitle>{anchor.kind==='block'?'블록에 댓글':'문장에 댓글'}</DialogTitle></DialogHeader>
   <div className="bit-rich-document rd-comment-composer flex flex-col">
    <blockquote>{anchor.quote}</blockquote>
    <Textarea appearance="compact" aria-label="댓글 내용" autoFocus placeholder="개선 의견을 남겨보세요" value={body} onChange={event=>setBody(event.target.value)} rows={4} maxLength={4000}
     onKeyDown={event=>{if((event.ctrlKey||event.metaKey)&&event.key==='Enter'&&!event.nativeEvent.isComposing){event.preventDefault();submit();}}}/>
   </div>
   <DialogFooter className="items-center sm:justify-between">
    <p className="text-xs text-muted-foreground">Ctrl+Enter로 등록</p>
    <div className="flex gap-2">
     <Button variant="ghost" size="sm" onClick={onCancel}>취소</Button>
     <Button size="sm" disabled={!body.trim()} onClick={submit}>댓글 등록</Button>
    </div>
   </DialogFooter>
  </DialogContent>
 </Dialog>;
}
