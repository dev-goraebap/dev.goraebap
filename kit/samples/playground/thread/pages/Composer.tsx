import {createStaticSource} from '@astryxdesign/core/Typeahead';
import {ChatComposer,ChatComposerInput} from '@astryxdesign/core/Chat';
import { Button } from '@astryxdesign/core/Button';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import styles from './thread.module.css';

/** 키보드가 올라온 만큼(보이는 영역이 줄어든 만큼)을 CSS 변수로 알린다. 입력 칸이 키보드 위로 올라오게 한다. */
function useKeyboardInset(target: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const viewport = window.visualViewport;
    const element = target.current;
    if (!viewport || !element) return undefined;
    const update = () => element.style.setProperty('--keyboard-inset', `${Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop))}px`);
    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => { viewport.removeEventListener('resize', update); viewport.removeEventListener('scroll', update); };
  }, [target]);
}

/**
 * 대화 입력 칸: Enter로 보내고 Shift+Enter로 줄을 바꾼다(한글 조합 중에는 보내지 않는다). @를 치면 방 사람을 골라 넣는다
 * (위·아래로 옮기고 Enter·Tab으로 고르고 Esc로 닫는다). 보내기 버튼은 비어 있어도 막지 않고 입력 칸으로 초점을 돌린다.
 * 휴대폰은 홈 표시줄과 키보드를 피해 입력 칸이 올라온다. before에는 입력 칸 위에 뜨는 것(새 글 알림)을 둔다.
 */
export function Composer({people,onSend,before}:{people:string[];onSend:(body:string)=>void;before?:ReactNode}){
 const [value,setValue]=useState('');const root=useRef<HTMLDivElement>(null);useKeyboardInset(root);
 const send=(text:string)=>{if(!text.trim())return;onSend(text.trim());setValue('')};
 const source=createStaticSource(people.map(name=>({id:name,label:name})));
 return <div ref={root} className={styles.composer}>{before}<ChatComposer elevation="none" density="compact" value={value} onChange={setValue} onSubmit={send}
 input={<ChatComposerInput label="메시지" placeholder="메시지를 입력하세요. @로 사람을 부를 수 있습니다." pasteAsToken={false} triggers={[{character:'@',searchSource:source,onSelect:item=>'@'+item.label+' ',menuLabel:'멘션할 사람'}]}/>}
 sendButton={<Button label="보내기" variant="primary" isIconOnly icon={<span aria-hidden>↑</span>} onClick={()=>send(value)}/>} /></div>;
}
