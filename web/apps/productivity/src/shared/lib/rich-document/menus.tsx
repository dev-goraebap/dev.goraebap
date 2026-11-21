import type {Editor} from '@tiptap/react';
import {useId,type ReactNode} from 'react';
import {Check,ChevronRight} from './icons';

/**
 * 편집기의 떠 있는 메뉴가 함께 쓰는 부품(cowork): 메뉴 한 줄(MenuItem), 글자색·배경색 목록(ColorList), 블록 종류
 * 목록(TurnIntoList). 블록 손잡이 메뉴, 글을 고르면 뜨는 서식 도구, 표 메뉴가 같은 모양을 쓴다.
 */
export const COLOR_NAMES=['기본','회색','갈색','주황색','노란색','초록색','파란색','보라색','분홍색','빨간색'];
export const INK=['','#9b9a97','#ba927a','#df9b65','#d8bd6a','#89af8b','#80afcf','#b59aca','#cf91b1','#d98c87'];
export const FILL=['','#363633','#493b34','#533f2c','#514a2c','#304638','#2d4153','#41344f','#4d3543','#503631'];

/** 링크 입력 칸에서 이름으로 찾아 걸 수 있는 것(같은 프로젝트의 문서): 이름, 앱 안의 주소, 덧붙이는 설명. */
export type LinkChoice={title:string;href:string;hint?:string};

/** 맥에서는 ⌘, 그 밖에서는 Ctrl. 메뉴의 단축키 표기에 쓴다. */
export const MOD=typeof navigator!=='undefined'&&/Mac|iPhone|iPad/.test(navigator.platform)?'⌘':'Ctrl';

/** 메뉴 한 줄: 아이콘, 이름, 그리고 오른쪽에 단축키·하위 메뉴 화살표·선택 표시 중 하나. 누를 때 본문의 선택이 풀리지 않게 한다. */
export function MenuItem({icon,label,description,hint,hasMore,isChecked,isDanger,isOpen,disabled,onSelect,onPointerEnter,onFocus}:{
 icon?:ReactNode;label:string;description?:string;hint?:string;hasMore?:boolean;isChecked?:boolean;isDanger?:boolean;isOpen?:boolean;disabled?:boolean;onSelect:()=>void;onPointerEnter?:()=>void;onFocus?:()=>void;
}){
 const descriptionId=useId();
 return <button type="button" role="menuitem" className="rd-menu-item" data-danger={isDanger||undefined} data-open={isOpen||undefined} aria-haspopup={hasMore?'menu':undefined}
  aria-label={description?label:undefined} aria-describedby={description?descriptionId:undefined} aria-expanded={hasMore?!!isOpen:undefined} disabled={disabled} onMouseDown={event=>event.preventDefault()} onClick={onSelect} onPointerEnter={onPointerEnter} onFocus={onFocus}>
  {icon!==undefined&&<span className="rd-menu-icon" aria-hidden="true">{icon}</span>}
  <span className="rd-menu-label">{label}{description&&<small id={descriptionId} className="rd-menu-description">{description}</small>}</span>
  {hint&&<kbd className="rd-menu-hint">{hint}</kbd>}
  {hasMore&&<ChevronRight size={14}/>}
  {isChecked&&<Check size={14}/>}
 </button>;
}

export const MenuDivider=()=><hr className="rd-menu-divider"/>;

/** 글자색과 배경색 목록. 값은 색상 코드, 빈 글은 기본(색 없음). */
export function ColorList({text,background,onText,onBackground}:{text:string;background:string;onText:(color:string)=>void;onBackground:(color:string)=>void}){
 return <>
  <div className="rd-menu-title">글자색</div>
  {INK.map((color,index)=><MenuItem key={`ink-${index}`} label={`${COLOR_NAMES[index]} 글자`} isChecked={text===color} onSelect={()=>onText(color)}
   icon={<span className="rd-ink" style={color?{color}:undefined}>A</span>}/>)}
  <MenuDivider/>
  <div className="rd-menu-title">배경색</div>
  {FILL.map((color,index)=><MenuItem key={`fill-${index}`} label={`${COLOR_NAMES[index]} 배경`} isChecked={background===color} onSelect={()=>onBackground(color)}
   icon={<span className="rd-fill" style={color?{background:color}:undefined}/>}/>)}
 </>;
}

/** 서로 바꿀 수 있는 글 블록의 종류. glyph는 메뉴에 보이는 짧은 표시다. */
export const TEXT_BLOCKS=[
 {id:'paragraph',label:'텍스트',glyph:'T'},
 {id:'heading1',label:'제목 1',glyph:'H1'},{id:'heading2',label:'제목 2',glyph:'H2'},{id:'heading3',label:'제목 3',glyph:'H3'},{id:'heading4',label:'제목 4',glyph:'H4'},
 {id:'bulletList',label:'글머리 목록',glyph:'•'},{id:'orderedList',label:'번호 목록',glyph:'1.'},{id:'taskList',label:'할 일 목록',glyph:'☑'},
 {id:'blockquote',label:'인용',glyph:'❞'},{id:'codeBlock',label:'코드',glyph:'</>'},
] as const;
export type TextBlockId=typeof TEXT_BLOCKS[number]['id'];

/** 커서가 있는 글 블록의 종류. 목록·인용 안의 문단은 그 목록·인용으로 본다. */
export function textBlockOf(editor:Editor):TextBlockId{
 if(editor.isActive('heading'))return `heading${Math.max(2,Number(editor.getAttributes('heading').level))}` as TextBlockId;
 for(const id of ['bulletList','orderedList','taskList','blockquote','codeBlock'] as const)if(editor.isActive(id))return id;
 return 'paragraph';
}

/** 고른 글 블록을 다른 종류로 바꾼다. 먼저 목록·인용을 풀어 문단으로 만든 뒤(clearNodes) 새 종류를 입힌다. */
export function turnInto(editor:Editor,id:TextBlockId){
 const chain=editor.chain().focus().clearNodes();
 if(id.startsWith('heading'))return chain.setHeading({level:Number(id.slice(-1)) as 1|2|3|4}).run();
 if(id==='bulletList')return chain.toggleBulletList().run();
 if(id==='orderedList')return chain.toggleOrderedList().run();
 if(id==='taskList')return chain.toggleTaskList().run();
 if(id==='blockquote')return chain.setBlockquote().run();
 if(id==='codeBlock')return chain.setCodeBlock().run();
 return chain.run();
}

export function TurnIntoList({current,onSelect}:{current?:TextBlockId;onSelect:(id:TextBlockId)=>void}){
 return <>
  <div className="rd-menu-title">종류 바꾸기</div>
  {TEXT_BLOCKS.filter(block=>block.id!=='heading1').map(block=><MenuItem key={block.id} label={block.label} isChecked={current===block.id} onSelect={()=>onSelect(block.id)} icon={<span className="rd-glyph">{block.glyph}</span>}/>)}
 </>;
}

/** 메뉴 안에서 위·아래 화살표와 Home·End로 항목을 옮겨 다닌다. 다룬 키면 true. */
export function moveInMenu(event:React.KeyboardEvent,scope:HTMLElement|null):boolean{
 if(!scope||!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return false;
 const items=Array.from(scope.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')).filter(item=>item.closest('.rd-menu-scope')===scope);
 const at=items.indexOf(document.activeElement as HTMLButtonElement);
 items[event.key==='Home'?0:event.key==='End'?items.length-1:(at+(event.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus();
 event.preventDefault();event.stopPropagation();
 return true;
}
