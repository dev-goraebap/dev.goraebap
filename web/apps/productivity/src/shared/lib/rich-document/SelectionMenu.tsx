import type {Editor} from '@tiptap/react';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {Bold,ChevronDown,Code,Eraser,ExternalLink,FileText,Italic,LinkChain,MoreVertical,Strikethrough,Trash2,Underline} from './icons';
import {ColorList,MenuItem,TEXT_BLOCKS,TurnIntoList,moveInMenu,textBlockOf,turnInto,type LinkChoice} from './menus';

type Panel='type'|'color'|'more'|'link';
/** 줄 정렬 그림: 길이가 다른 가로줄 넷을 정렬 방향에 맞춰 놓는다(Solar에 글 정렬 아이콘이 없다). */
export function AlignGlyph({kind}:{kind:'left'|'center'|'right'|'justify'}){
 const widths=kind==='justify'?[14,14,14,14]:[14,9,12,7];
 return <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
  {widths.map((width,row)=>{const start=kind==='center'?(16-width)/2:kind==='right'?15-width:1;return <path key={row} d={`M${start} ${3+row*3.3}h${width}`}/>;})}
 </svg>;
}
/** 들여쓰기·내어쓰기 그림: 줄 셋과 방향 화살표. */
export function IndentGlyph({isOut=false}:{isOut?:boolean}){
 return <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
  <path d="M7 3h8M7 8h8M7 13h8"/><path d={isOut?'M4 5.5 1.5 8 4 10.5':'M1.5 5.5 4 8 1.5 10.5'}/>
 </svg>;
}

/**
 * 글을 고르면 그 위에 뜨는 서식 도구(cowork). 왼쪽부터 블록 종류, 굵게·기울임·밑줄·취소선·코드, 링크, 색, 더 보기다.
 * 종류 · 링크 · 색은 도구 아래로 펼쳐지고, 더 보기는 도구 위에 한 줄(위·아래 첨자, 줄 정렬, 내어쓰기·들여쓰기, 서식
 * 지우기)이 뜬다. Markdown으로 저장하는 본문(일정·공지 등)에는 Markdown에 담을 수 없는 것(밑줄·첨자·정렬)을 보이지 않는다.
 */
/** 주소로 쓸 수 있게 다듬는다: 앱 안의 주소(/…)와 https · http · mailto는 그대로, 점이 든 낱말(example.com)은 https://를 붙인다. 그 밖은 빈 글. */
function hrefOf(text:string):string{
 const value=text.trim();
 if(/^(https?:\/\/|mailto:)/i.test(value)||/^\/(?!\/)/.test(value))return value;
 return /^[^\s/]+\.[^\s]{2,}$/.test(value)?`https://${value}`:'';
}

/**
 * 링크 입력 칸: 주소를 붙여 넣거나, 문서 이름을 쳐서 같은 프로젝트의 문서를 골라 건다(links). Enter는 주소면 그 주소로,
 * 아니면 맨 위 문서로 건다. 이미 링크가 걸린 글이면 열기와 지우기가 함께 보인다.
 */
export function LinkPanel({editor,links,onDone}:{editor:Editor;links?:LinkChoice[];onDone:()=>void}){
 const current=String(editor.getAttributes('link').href??'');
 const [text,setText]=useState(current);
 const href=hrefOf(text),word=text.trim().toLowerCase();
 const found=!href&&word&&links?links.filter(link=>link.title.toLowerCase().includes(word)).slice(0,7):!text.trim()&&links?links.slice(0,5):[];
 const apply=(target:string)=>{editor.chain().focus().extendMarkRange('link').setLink({href:target}).run();onDone();};
 const submit=()=>{if(href)apply(href);else if(found[0])apply(found[0].href);};
 return <div className="block-menu rd-pop rd-pop-start rd-link-pop rd-menu-scope" role="dialog" aria-label="링크">
  <div className="rd-link-row">
   <LinkChain size={16}/>
   <input className="rd-link-input" autoFocus value={text} placeholder={links?'주소를 붙여 넣거나 문서 이름으로 찾기':'주소를 붙여 넣기 (https://…)'} aria-label="링크 주소 또는 문서 이름"
    onChange={event=>setText(event.target.value)} onKeyDown={event=>{if(event.key==='Enter'&&!event.nativeEvent.isComposing){event.preventDefault();event.stopPropagation();submit();}}}/>
   {current&&<>
    <a className="rd-tool" href={current} target="_blank" rel="noopener noreferrer" aria-label="링크 열기" title="링크 열기"><ExternalLink size={15}/></a>
    <button type="button" className="rd-tool" aria-label="링크 지우기" title="링크 지우기" onMouseDown={event=>event.preventDefault()} onClick={()=>{editor.chain().focus().extendMarkRange('link').unsetLink().run();onDone();}}><Trash2 size={15}/></button>
   </>}
  </div>
  {href&&href!==current&&<MenuItem icon={<LinkChain size={16}/>} label={`${href} 로 연결`} hint="Enter" onSelect={()=>apply(href)}/>}
  {found.length>0&&<><div className="rd-menu-title">문서</div>{found.map(link=><MenuItem key={link.href} icon={<FileText size={16}/>} label={link.title} hint={link.hint} onSelect={()=>apply(link.href)}/>)}</>}
  {!href&&word&&!found.length&&<div className="rd-link-empty">{links?'찾은 문서가 없습니다. 주소는 https://로 시작해 주세요.':'https:// 또는 mailto:로 시작하는 주소를 넣어 주세요.'}</div>}
 </div>;
}

export function SelectionMenu({editor,isMarkdownDraft=false,links,trailing}:{editor:Editor;isMarkdownDraft?:boolean;links?:LinkChoice[];trailing?:ReactNode}){
 const [open,setOpen]=useState<Panel|null>(null),root=useRef<HTMLDivElement>(null);
 const isEmpty=editor.state.selection.empty;
 // 선택이 풀려 도구가 사라지면 펼친 것도 접는다.
 useEffect(()=>{if(isEmpty)setOpen(null);},[isEmpty]);
 const keep=(event:React.MouseEvent)=>event.preventDefault();
 const chain=()=>editor.chain().focus();
 const tool=(label:string,isActive:boolean,run:()=>unknown,drawing:ReactNode,disabled=false)=><button type="button" className="rd-tool" aria-label={label} title={label} aria-pressed={isActive}
  disabled={disabled} onMouseDown={keep} onClick={()=>{run();}}>{drawing}</button>;
 const toggle=(panel:Panel)=>()=>setOpen(now=>now===panel?null:panel);
 const type=textBlockOf(editor),ink=editor.getAttributes('textStyle').color??'',fill=editor.getAttributes('highlight').color??'';
 const align=editor.getAttributes('paragraph').textAlign??editor.getAttributes('heading').textAlign??'left';
 const listItem=editor.isActive('taskItem')?'taskItem':'listItem';
 const keys=(event:React.KeyboardEvent)=>{
  if(event.key==='Escape'&&open){event.preventDefault();event.stopPropagation();setOpen(null);editor.commands.focus();return;}
  moveInMenu(event,(event.target as HTMLElement).closest<HTMLElement>('.rd-menu-scope'));
 };
 return <div ref={root} className="selection-menu" role="toolbar" aria-label="선택 텍스트 서식" onKeyDown={keys}>
  <button type="button" className="rd-tool rd-tool-wide" aria-label="블록 종류" title="블록 종류" aria-haspopup="menu" aria-expanded={open==='type'} onMouseDown={keep} onClick={toggle('type')}>
   {TEXT_BLOCKS.find(block=>block.id===type)?.label}<ChevronDown size={12}/>
  </button>
  <span className="rd-tool-divider"/>
  {tool('굵게',editor.isActive('bold'),()=>chain().toggleBold().run(),<Bold size={16}/>)}
  {tool('기울임',editor.isActive('italic'),()=>chain().toggleItalic().run(),<Italic size={16}/>)}
  {!isMarkdownDraft&&tool('밑줄',editor.isActive('underline'),()=>chain().toggleUnderline().run(),<Underline size={16}/>)}
  {tool('취소선',editor.isActive('strike'),()=>chain().toggleStrike().run(),<Strikethrough size={16}/>)}
  {tool('인라인 코드',editor.isActive('code'),()=>chain().toggleCode().run(),<Code size={16}/>)}
  <span className="rd-tool-divider"/>
  <button type="button" className="rd-tool" aria-label="링크" title="링크" aria-pressed={editor.isActive('link')} aria-haspopup="dialog" aria-expanded={open==='link'} onMouseDown={keep} onClick={toggle('link')}><LinkChain size={16}/></button>
  <button type="button" className="rd-tool rd-tool-wide" aria-label="색" title="색" aria-haspopup="menu" aria-expanded={open==='color'} onMouseDown={keep} onClick={toggle('color')}>
   <span className="rd-ink rd-ink-ring" style={{color:ink||undefined,background:fill||undefined}}>A</span><ChevronDown size={12}/>
  </button>
  {trailing}
  <span className="rd-tool-divider"/>
  <button type="button" className="rd-tool" aria-label="더 보기" title="더 보기" aria-haspopup="true" aria-expanded={open==='more'} onMouseDown={keep} onClick={toggle('more')}><MoreVertical size={16}/></button>
  {open==='link'&&<LinkPanel editor={editor} links={links} onDone={()=>setOpen(null)}/>}
  {open==='type'&&<div className="block-menu rd-pop rd-pop-start rd-menu-scope" role="menu" aria-label="블록 종류">
   <TurnIntoList current={type} onSelect={id=>{turnInto(editor,id);setOpen(null);}}/>
  </div>}
  {open==='color'&&<div className="block-menu rd-pop rd-pop-end rd-menu-scope" role="menu" aria-label="색">
   <ColorList text={ink} background={fill} onText={color=>{if(color)chain().setColor(color).run();else chain().unsetColor().run();setOpen(null);}}
    onBackground={color=>{if(color)chain().setHighlight({color}).run();else chain().unsetHighlight().run();setOpen(null);}}/>
  </div>}
  {open==='more'&&<div className="selection-menu rd-pop-row" role="group" aria-label="더 많은 서식">
   {!isMarkdownDraft&&<>
    {tool('위 첨자',editor.isActive('superscript'),()=>chain().toggleSuperscript().run(),<span className="rd-script">x<sup>2</sup></span>)}
    {tool('아래 첨자',editor.isActive('subscript'),()=>chain().toggleSubscript().run(),<span className="rd-script">x<sub>2</sub></span>)}
    <span className="rd-tool-divider"/>
    {(['left','center','right','justify'] as const).map(kind=><span key={kind}>{tool({left:'왼쪽 정렬',center:'가운데 정렬',right:'오른쪽 정렬',justify:'양쪽 정렬'}[kind],align===kind,()=>chain().setTextAlign(kind).run(),<AlignGlyph kind={kind}/>)}</span>)}
    <span className="rd-tool-divider"/>
   </>}
   {tool('내어쓰기',false,()=>chain().liftListItem(listItem).run(),<IndentGlyph isOut/>,!editor.can().liftListItem(listItem))}
   {tool('들여쓰기',false,()=>chain().sinkListItem(listItem).run(),<IndentGlyph/>,!editor.can().sinkListItem(listItem))}
   <span className="rd-tool-divider"/>
   {tool('서식 지우기',false,()=>chain().unsetAllMarks().run(),<Eraser size={16}/>)}
  </div>}
 </div>;
}
