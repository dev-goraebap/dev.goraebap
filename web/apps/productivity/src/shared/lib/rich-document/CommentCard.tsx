import {useState} from 'react';
import {Button} from '@goraebap/ui-react/compact/button';
import {Textarea} from '@goraebap/ui-react/components/textarea';
import {Check,RotateCw} from './icons';
import {anchorLabels,isResolved,type CommentThread} from './comments';
export function CommentCard({thread,active,readonly,onSelect,onReply,onResolve}:{thread:CommentThread;active:boolean;readonly:boolean;onSelect:()=>void;onReply:(body:string)=>void;onResolve:(resolved:boolean)=>void}){
 const [reply,setReply]=useState(''),resolved=isResolved(thread);
 return <article className={`rd-comment-card ${active?'is-active':''} ${resolved?'is-resolved':''}`} data-thread-id={thread.id}>
  <button type="button" className="rd-comment-quote" onClick={onSelect} aria-label="댓글 위치로 이동"><span>{thread.anchor.kind==='block'?'블록':'문장'}</span><blockquote>{thread.anchor.quote}</blockquote><small data-anchor-status={thread.anchor.status}>{anchorLabels[thread.anchor.status]}</small></button>
  <div className="rd-comment-messages">{thread.messages.map(message=><div key={message.id}><header><strong>{message.author}</strong><time dateTime={message.created}>{new Date(message.created).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}</time></header><p>{message.body}</p></div>)}</div>
  <footer><span>{resolved?'해결됨':'미해결'}</span>{!readonly&&<Button variant="ghost" size="sm" onClick={()=>onResolve(!resolved)}>{resolved?<RotateCw size={14}/>:<Check size={14}/>}{resolved?'댓글 다시 열기':'댓글 해결'}</Button>}</footer>
  {active&&!readonly&&<form className="rd-comment-reply" onSubmit={event=>{event.preventDefault();if(reply.trim()){onReply(reply.trim());setReply('');}}}>
   <Textarea appearance="compact" aria-label="답글" placeholder="답글을 남기세요" rows={2} maxLength={4000} value={reply} onChange={event=>setReply(event.target.value)}/>
   <Button variant="secondary" size="sm" type="submit" disabled={!reply.trim()}>답글 등록</Button>
  </form>}
 </article>;
}
