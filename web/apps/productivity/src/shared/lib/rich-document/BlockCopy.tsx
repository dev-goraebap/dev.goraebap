import {useEffect,useRef,useState} from 'react';
import {Check,Copy,AlertCircle} from './icons';
import {Button} from './Button';
export function BlockCopy({text,label}:{text:string;label:string}){
 const [state,setState]=useState<'idle'|'copied'|'error'>('idle');const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 return <Button className="block-copy" aria-label={label} title={state==='copied'?'복사됨':state==='error'?'복사하지 못했습니다':label} onClick={async()=>{try{await navigator.clipboard.writeText(text);setState('copied');}catch{setState('error');}clearTimeout(timer.current);timer.current=setTimeout(()=>setState('idle'),1800);}}>{state==='copied'?<Check size={14}/>:state==='error'?<AlertCircle size={14}/>:<Copy size={14}/>}<span className="block-copy-status" role="status">{state==='copied'?'복사됨':state==='error'?'복사 실패':''}</span></Button>;
}
