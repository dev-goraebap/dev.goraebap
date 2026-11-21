import type {Editor} from '@tiptap/react';
import {useEffect,useReducer,useState,type ReactNode} from 'react';
import {Bold,ChevronDown,Eraser,Italic,LinkChain,List,ListOrdered,ListTodo,Redo2,Strikethrough,Underline,Undo2} from './icons';
import {ColorList,MenuItem,TEXT_BLOCKS,TurnIntoList,moveInMenu,textBlockOf,turnInto} from './menus';
import type {LinkChoice} from './menus';
import {AlignGlyph,IndentGlyph,LinkPanel} from './SelectionMenu';

type Panel='type'|'color'|'link'|'align';
const ALIGNS={left:'왼쪽 정렬',center:'가운데 정렬',right:'오른쪽 정렬',justify:'양쪽 정렬'} as const;

/**
 * 문서 편집기의 늘 붙은 서식 막대(cowork): 되돌리기·다시 하기, 블록 종류, 굵게·기울임·밑줄·취소선, 링크·색, 줄 정렬(펼침),
 * 목록, 내어쓰기·들여쓰기, 서식 지우기. 인라인 코드·첨자는 글을 고르면 뜨는 서식 도구(SelectionMenu)에 두고, 같은 부품을 쓴다. start·end는 막대 양 끝에
 * 덧붙일 도구다. 좁으면 줄을 바꿔 감싼다(가로 스크롤을 두지 않는다).
 */
export function DocumentFormatBar({editor,links,start,end}:{editor:Editor|null;links?:LinkChoice[];start?:ReactNode;end?:ReactNode}){
 const [open,setOpen]=useState<Panel|null>(null);
 const [,refresh]=useReducer((n:number)=>n+1,0);
 useEffect(()=>{if(!editor)return;editor.on('transaction',refresh);return()=>{editor.off('transaction',refresh);};},[editor]);
 const ready=!!editor&&!editor.isDestroyed;
 const keep=(event:React.MouseEvent)=>event.preventDefault();
 const chain=()=>editor!.chain().focus();
 const tool=(label:string,isActive:boolean,run:()=>unknown,drawing:ReactNode,disabled=false)=><button type="button" className="rd-tool" aria-label={label} title={label} aria-pressed={isActive}
  disabled={!ready||disabled} onMouseDown={keep} onClick={()=>{run();}}>{drawing}</button>;
 const toggle=(panel:Panel)=>()=>setOpen(now=>now===panel?null:panel);
 const type=ready?textBlockOf(editor):'paragraph';
 const ink=ready?editor.getAttributes('textStyle').color??'':'',fill=ready?editor.getAttributes('highlight').color??'':'';
 const align=ready?editor.getAttributes('paragraph').textAlign??editor.getAttributes('heading').textAlign??'left':'left';
 const listItem=ready&&editor.isActive('taskItem')?'taskItem':'listItem';
 const is=(name:string)=>ready&&editor.isActive(name);
 const keys=(event:React.KeyboardEvent)=>{
  if(event.key==='Escape'&&open){event.preventDefault();event.stopPropagation();setOpen(null);editor?.commands.focus();return;}
  moveInMenu(event,(event.target as HTMLElement).closest<HTMLElement>('.rd-menu-scope'));
 };
 return <div className="rd-format-bar" role="toolbar" aria-label="서식" onKeyDown={keys}>
  {start?<div className="rd-format-end">{start}</div>:null}
  <div className="rd-format-tools">
   {tool('되돌리기',false,()=>chain().undo().run(),<Undo2 size={16}/>,!ready||!editor.can().undo())}
   {tool('다시 하기',false,()=>chain().redo().run(),<Redo2 size={16}/>,!ready||!editor.can().redo())}
   <span className="rd-tool-divider"/>
   <span className="rd-format-anchor">
    <button type="button" className="rd-tool rd-tool-wide" aria-label="블록 종류" title="블록 종류" aria-haspopup="menu" aria-expanded={open==='type'} disabled={!ready} onMouseDown={keep} onClick={toggle('type')}>
     {TEXT_BLOCKS.find(block=>block.id===type)?.label??'본문'}<ChevronDown size={12}/>
    </button>
    {open==='type'&&ready&&<div className="block-menu rd-pop rd-pop-start rd-menu-scope" role="menu" aria-label="블록 종류">
     <TurnIntoList current={type} onSelect={id=>{turnInto(editor,id);setOpen(null);}}/>
    </div>}
   </span>
   <span className="rd-tool-divider"/>
   {tool('굵게',is('bold'),()=>chain().toggleBold().run(),<Bold size={16}/>)}
   {tool('기울임',is('italic'),()=>chain().toggleItalic().run(),<Italic size={16}/>)}
   {tool('밑줄',is('underline'),()=>chain().toggleUnderline().run(),<Underline size={16}/>)}
   {tool('취소선',is('strike'),()=>chain().toggleStrike().run(),<Strikethrough size={16}/>)}
   <span className="rd-format-anchor">
    <button type="button" className="rd-tool" aria-label="링크" title="링크" aria-pressed={is('link')} aria-haspopup="dialog" aria-expanded={open==='link'} disabled={!ready} onMouseDown={keep} onClick={toggle('link')}><LinkChain size={16}/></button>
    {open==='link'&&ready&&<LinkPanel editor={editor} links={links} onDone={()=>setOpen(null)}/>}
   </span>
   <span className="rd-format-anchor">
    <button type="button" className="rd-tool rd-tool-wide" aria-label="색" title="색" aria-haspopup="menu" aria-expanded={open==='color'} disabled={!ready} onMouseDown={keep} onClick={toggle('color')}>
     <span className="rd-ink rd-ink-ring" style={{color:ink||undefined,background:fill||undefined}}>A</span><ChevronDown size={12}/>
    </button>
    {open==='color'&&ready&&<div className="block-menu rd-pop rd-pop-start rd-menu-scope" role="menu" aria-label="색">
     <ColorList text={ink} background={fill} onText={color=>{if(color)chain().setColor(color).run();else chain().unsetColor().run();setOpen(null);}}
      onBackground={color=>{if(color)chain().setHighlight({color}).run();else chain().unsetHighlight().run();setOpen(null);}}/>
    </div>}
   </span>
   <span className="rd-tool-divider"/>
   <span className="rd-format-anchor">
    <button type="button" className="rd-tool rd-tool-wide" aria-label="줄 정렬" title="줄 정렬" aria-haspopup="menu" aria-expanded={open==='align'} disabled={!ready} onMouseDown={keep} onClick={toggle('align')}>
     <AlignGlyph kind={align as keyof typeof ALIGNS}/><ChevronDown size={12}/>
    </button>
    {open==='align'&&ready&&<div className="block-menu rd-pop rd-pop-start rd-menu-scope" role="menu" aria-label="줄 정렬">
     {(Object.keys(ALIGNS) as (keyof typeof ALIGNS)[]).map(kind=><MenuItem key={kind} icon={<AlignGlyph kind={kind}/>} label={ALIGNS[kind]} isChecked={align===kind}
      onSelect={()=>{chain().setTextAlign(kind).run();setOpen(null);}}/>)}
    </div>}
   </span>
   <span className="rd-tool-divider"/>
   {tool('글머리 기호 목록',is('bulletList'),()=>chain().toggleBulletList().run(),<List size={16}/>)}
   {tool('번호 목록',is('orderedList'),()=>chain().toggleOrderedList().run(),<ListOrdered size={16}/>)}
   {tool('할 일 목록',is('taskList'),()=>chain().toggleTaskList().run(),<ListTodo size={16}/>)}
   {tool('내어쓰기',false,()=>chain().liftListItem(listItem).run(),<IndentGlyph isOut/>,!ready||!editor.can().liftListItem(listItem))}
   {tool('들여쓰기',false,()=>chain().sinkListItem(listItem).run(),<IndentGlyph/>,!ready||!editor.can().sinkListItem(listItem))}
   <span className="rd-tool-divider"/>
   {tool('서식 지우기',false,()=>chain().unsetAllMarks().run(),<Eraser size={16}/>)}
  </div>
  {end?<div className="rd-format-end">{end}</div>:null}
 </div>;
}
