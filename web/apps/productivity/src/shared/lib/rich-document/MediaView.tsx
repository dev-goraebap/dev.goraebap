import {WidthControl} from './WidthControl';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {NodeViewWrapper,type NodeViewProps} from '@tiptap/react';
import {closeHistory} from '@tiptap/pm/history';
import {FileText,Download,RotateCw,AlertCircle,LoaderCircle,Search} from './icons';
import {fileKind} from './file-kinds';
import {useEditable} from './block-ui';
import {Button} from './Button';
import {clampWidth,bytes} from './media-node';
import {isImageAtHand,noteImageArrived} from '@/shared/lib/image-traits';
import {openHtml,openZoom} from '@/shared/ui/zoom-viewer';
/** 내려받기 주소: 서비스의 첨부 주소면 download=true를 붙여 저장소가 '내려받기'로 주게 한다(그 밖은 그대로). */
function downloadHref(src:string){if(!src)return undefined;if(!/^\/api\/.+\/files\//.test(src))return src;return `${src}${src.includes('?')?'&':'?'}download=true`;}
export function MediaView({node,editor,updateAttributes,getPos,selected}:NodeViewProps){
 const editable=useEditable(editor),a=node.attrs,kind=a.mime.startsWith('image/')?'image':a.mime.startsWith('video/')?'video':a.mime.startsWith('audio/')?'audio':'file',label={image:'이미지',video:'동영상',audio:'오디오',file:'파일'}[kind];
 const safe=(/^(\/(?!\/)|https:\/\/|blob:)/.test(String(a.src)))?String(a.src):'',width=clampWidth(a.width);const [state,setState]=useState<'loading'|'ready'|'error'>('loading'),[retry,setRetry]=useState(0),[size,setSize]=useState(Number(a.size)||0);
 const stage=useRef<HTMLDivElement>(null),picture=useRef<HTMLImageElement>(null),[nearby,setNearby]=useState(false),[loadedWidth,setLoadedWidth]=useState(0);
 const src=retry&&!safe.startsWith('blob:')?`${safe}${safe.includes('?')?'&':'?'}retry=${retry}`:safe;
 // 올릴 때 잰 대표색과 원본 비율이 있으면 자리를 먼저 그 색·비율로 칠하고, 받아야 하는 사진만 서서히 나타낸다(이미 받은 사진은 바로).
 const color=kind==='image'&&typeof a.color==='string'&&/^#[0-9a-fA-F]{6}$/.test(a.color)?a.color:undefined,ratio=kind==='image'&&Number(a.pixelWidth)>0&&Number(a.pixelHeight)>0?`${a.pixelWidth} / ${a.pixelHeight}`:undefined,[atHand]=useState(()=>isImageAtHand(safe));
 const attrSize=Number(a.size)||0;
 useLayoutEffect(()=>{setState('loading');if(!safe){setState('error');return;}if(kind!=='file')return;if(safe.startsWith('blob:')){setSize(attrSize);setState('ready');return;}const controller=new AbortController();void fetch(src,{method:'HEAD',redirect:'manual',signal:controller.signal}).then(r=>{if(r.type==='opaqueredirect'){setSize(attrSize);setState('ready');return;}if(!r.ok)throw Error();setSize(Number(r.headers.get('content-length'))||attrSize);setState('ready');}).catch(e=>{if(e.name!=='AbortError')setState('error');});return()=>controller.abort();},[src,kind,safe,attrSize]);
 useEffect(()=>{if(!stage.current)return;const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting))setNearby(true);},{rootMargin:'300px'});observer.observe(stage.current);return()=>observer.disconnect();},[kind]);
 useEffect(()=>{if(state!=='loading'||(kind!=='file'&&!nearby))return;const timer=setTimeout(()=>setState('error'),15000);return()=>clearTimeout(timer);},[state,retry,nearby,kind]);
 const changeWidth=(value:number)=>{editor.view.dispatch(closeHistory(editor.state.tr));updateAttributes({width:value});editor.view.dispatch(closeHistory(editor.state.tr));const pos=getPos();if(typeof pos==='number')editor.chain().focus().setNodeSelection(pos).run();};
 const status=state==='loading'&&color?null:state==='error'?<div className="media-state error" role="alert"><AlertCircle size={20}/><strong>{label}를 불러오지 못했습니다</strong><span>연결이나 파일 상태를 확인해 주세요.</span><Button bordered onClick={()=>setRetry(n=>n+1)}><RotateCw size={13}/>다시 시도</Button></div>:state==='loading'?<div className="media-state loading" role="status"><LoaderCircle size={19}/><span>{label} 불러오는 중…</span></div>:null;
 const zoom=()=>{const image=picture.current;if(image)openZoom({src:image.currentSrc||src,alt:a.name,width:Number(a.pixelWidth)||image.naturalWidth||undefined,height:Number(a.pixelHeight)||image.naturalHeight||undefined});};
 // 첨부(서비스의 /api/…/files/…)는 서버가 저장소의 짧은 주소로 넘긴다. 받기는 download=true로 '내려받기'로 넘기게 하고, 있는지
 // 확인(HEAD)은 그 넘김(다른 출처라 CORS로 막힐 수 있다)을 따라가지 않고 넘김 자체를 '있음'으로 본다.
 const file=fileKind(String(a.name));
 // HTML 파일은 카드 아래에 미리보기를 둔다. 올린 사람의 스크립트가 들어 있을 수 있으므로 격리된 틀(sandbox, 같은 출처 권한 없음)
 // 안에서만 그린다: 틀 안의 문서는 이 앱의 화면·쿠키·저장소에 닿지 못한다.
 const isHtml=kind==='file'&&(a.mime==='text/html'||/\.html?$/i.test(String(a.name)));
 // 블록 위에 떠 있는 도구: 포인터를 올리거나 초점이 들어오면 보인다(머리 띠를 두지 않는다).
 const tools=<span className="media-tools">
  {kind==='image'&&state==='ready'&&<Button aria-label={`${a.name} 크게 보기`} title="크게 보기" onClick={zoom}><Search size={14}/></Button>}
  {isHtml&&safe&&state!=='error'&&<Button aria-label={`${a.name} 크게 보기`} title="크게 보기" onClick={()=>openHtml({src:String(src),title:String(a.name)})}><Search size={14}/></Button>}
  {editable&&(kind==='image'||kind==='video')&&<WidthControl value={width} onChange={changeWidth}/>}
  <a href={downloadHref(safe)} download={a.name} className="media-download" aria-label={`${a.name} 다운로드`} title="다운로드"><Download size={14}/></a>
 </span>;
 // 사진의 자리: 원본 비율을 알면 그 비율로, 너무 긴 사진은 높이 한도(--media-max-block)에 맞춘 폭으로 잡아 가운데에 둔다. 원본보다 넓히지는
 // 않는다: 비율만 보고 칸을 채우면 48×32 같은 작은 사진이 편집 중에 본문 폭(640px 남짓)으로 늘어나, 원본 크기로 그리던 읽기와 달랐다.
 const box=kind==='image'&&ratio&&state!=='error'?{aspectRatio:ratio,inlineSize:`min(100%, ${a.pixelWidth}px, calc(var(--media-max-block) * ${a.pixelWidth} / ${a.pixelHeight}))`,backgroundColor:state==='ready'?undefined:color}:state==='error'?undefined:{backgroundColor:color};
 // 작은 사진(원본 폭 160px 미만)은 도구를 사진 위에 띄우면 사진을 거의 덮는다(휴대폰은 늘 보인다). 그런 사진은 도구를 사진 틀 밖(figure)에
 // 두어, 포인터가 있는 화면에서는 사진 오른쪽 곁에, 휴대폰에서는 사진 아래 줄에 놓는다(styles.css의 data-compact).
 const natural=Number(a.pixelWidth)||loadedWidth,compact=kind==='image'&&state!=='error'&&natural>0&&natural<160;
 return <NodeViewWrapper as="figure" className={`doc-media media-${kind}${isHtml?' media-html':''} ${selected&&editable?'media-selected':''}`} data-media="" data-compact={compact||undefined} data-block-id={a.blockId} data-media-state={state} style={kind==='image'||kind==='video'?{width:`${width}%`,...(compact?{'--compact-w':`${natural}px`}:{})}:undefined} contentEditable={false}>
  {kind==='file'?<div className="file-card" data-tone={file.tone}>
   <span className="file-tile" aria-hidden="true"><FileText size={18}/><b>{file.label}</b></span>
   <div className="file-text"><strong>{a.name}</strong><span>{[file.name,bytes(size)].filter(Boolean).join(' · ')}</span></div>
   {tools}
  </div>:<div ref={stage} className={`media-stage ${state}${color?' has-color':''}`} style={box}>
   {safe&&kind==='image'&&<img ref={picture} key={src} src={src} alt={a.name} loading="lazy" className={[color&&!atHand?'media-fade':'',!editable?'media-zoomable':''].filter(Boolean).join(' ')||undefined}
    // 읽기 화면에서 누르면 크게 보기로 연다(편집 중에는 누르기가 선택이라 두지 않는다).
    onClick={editable?undefined:zoom} onLoad={event=>{noteImageArrived(src);setLoadedWidth(event.currentTarget.naturalWidth);setState('ready');}} onError={()=>setState('error')}/>}
   {safe&&kind==='video'&&<video key={src} src={src} controls preload="metadata" aria-label={a.name} onLoadedMetadata={()=>setState('ready')} onError={()=>setState('error')} onWaiting={()=>setState(prev=>prev==='error'?prev:'loading')} onCanPlay={()=>setState('ready')}/>}
   {safe&&kind==='audio'&&<audio key={src} src={src} controls preload="metadata" aria-label={a.name} onLoadedMetadata={()=>setState('ready')} onError={()=>setState('error')}/>}
   {status}
   {!compact&&tools}
  </div>}
  {compact&&tools}
  {isHtml&&safe&&state!=='error'&&<iframe className="html-frame" src={src} title={`${a.name} 미리보기`} sandbox="allow-scripts allow-modals allow-forms allow-popups" referrerPolicy="no-referrer" loading="lazy"/>}
  {kind==='file'&&status}
 </NodeViewWrapper>;
}
