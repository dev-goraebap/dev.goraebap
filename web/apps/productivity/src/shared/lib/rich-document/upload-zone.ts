import {Extension} from '@tiptap/core';
import {Plugin,PluginKey,type EditorState} from '@tiptap/pm/state';
import {Decoration,DecorationSet,type EditorView} from '@tiptap/pm/view';
import {solarData} from './solar-data';

/**
 * 파일을 올릴 자리(cowork). `/` 명령의 파일이나 HTML 임베드를 고르면 본문의 그 자리에 점선 칸이 뜬다(HTML 칸은 .html만 고르게 한다): 누르면 파일 고르기가 열리고, 파일을
 * 끌어다 놓아도 된다. 칸은 문서에 저장되지 않는 화면 표시(decoration)라서, 파일을 올리지 않고 닫아도 본문에 남는 것이 없다.
 * 파일이 올라가기 시작하면 칸은 닫히고 그 자리에 파일 블록이 들어간다.
 */
/** 칸의 종류: 아무 파일(file)이나, 본문에 미리보기로 넣을 HTML 파일(html). */
export type UploadZoneKind='file'|'html';
type ZoneState={pos:number|null;kind:UploadZoneKind};
export const uploadZoneKey=new PluginKey<ZoneState>('uploadZone');
type Storage={pick:(kind:UploadZoneKind)=>void};

/** 칸이 열려 있는 문서 위치. 닫혀 있으면 null. */
export const uploadZonePos=(state:EditorState)=>uploadZoneKey.getState(state)?.pos??null;
export const closeUploadZone=(view:EditorView)=>{if(uploadZonePos(view.state)!==null)view.dispatch(view.state.tr.setMeta(uploadZoneKey,{pos:null,kind:'file'}));};
/** 커서가 있는 블록 자리에 칸을 연다: 빈 줄이면 그 줄 앞에, 글이 있으면 그 블록 뒤에. */
export function openUploadZone(view:EditorView,kind:UploadZoneKind='file'){
 const {$from}=view.state.selection;
 const isEmptyLine=$from.parent.isTextblock&&$from.parent.content.size===0;
 const pos=$from.depth?(isEmptyLine?$from.before():$from.after()):$from.pos;
 view.dispatch(view.state.tr.setMeta(uploadZoneKey,{pos,kind}));
}

function zone(view:EditorView,storage:Storage,kind:UploadZoneKind){
 const words=kind==='html'?['HTML 파일을 눌러서 올리기','HTML 파일(.html) 하나에 최대 10MB · 본문에 미리보기로 들어갑니다']:['눌러서 올리기','사진 · 동영상 · 오디오 · 파일, 하나에 최대 10MB'];
 const box=document.createElement('div');
 box.className='rd-upload-zone';box.contentEditable='false';
 box.innerHTML=`<button type="button" class="rd-upload-pick"><span class="rd-upload-art"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">${solarData.CloudUpload.body}</svg></span>`
  +`<span class="rd-upload-text"><u>${words[0]}</u> 또는 끌어다 놓기</span><span class="rd-upload-hint">${words[1]}</span></button>`
  +'<button type="button" class="rd-upload-close" aria-label="올리는 칸 닫기" title="닫기">✕</button>';
 box.querySelector('.rd-upload-pick')!.addEventListener('click',()=>storage.pick(kind));
 box.querySelector('.rd-upload-close')!.addEventListener('click',()=>{closeUploadZone(view);view.focus();});
 box.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();closeUploadZone(view);view.focus();}});
 // 놓은 파일을 올리는 일은 편집기 틀이 한다(EditorSurface의 onDropCapture). 여기서는 끌어 온 동안의 표시만 맡는다.
 box.addEventListener('dragover',event=>{if(Array.from(event.dataTransfer?.types??[]).includes('Files')){event.preventDefault();box.dataset.over='';}});
 for(const name of ['dragleave','drop'] as const)box.addEventListener(name,()=>{delete box.dataset.over;});
 return box;
}

export const UploadZone=Extension.create<Record<string,never>,Storage>({
 name:'uploadZone',
 addStorage(){return {pick:(_kind:UploadZoneKind)=>undefined};},
 addProseMirrorPlugins(){
  const storage=this.storage;
  return [new Plugin({
   key:uploadZoneKey,
   state:{init:():ZoneState=>({pos:null,kind:'file'}),apply(tr,value){const meta=tr.getMeta(uploadZoneKey) as ZoneState|undefined;if(meta)return meta;return value.pos===null?value:{...value,pos:tr.mapping.map(value.pos)};}},
   props:{decorations(state){
    const {pos,kind}=uploadZoneKey.getState(state)!;
    return pos===null?null:DecorationSet.create(state.doc,[Decoration.widget(pos,view=>zone(view,storage,kind),{side:-1,key:`upload-zone-${kind}`,stopEvent:()=>true,ignoreSelection:true})]);
   }},
  })];
 },
});
