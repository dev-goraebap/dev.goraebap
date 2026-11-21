import {useEffect,useState} from 'react';
import {getJson,type components} from '@/shared/api';
import {Button} from './Button';
import {ExternalLink,Globe,Image,Pencil} from './icons';

/** 서버가 그 주소의 페이지에서 읽어 온 것(제목·설명·대표 사진). 읽지 못한 값은 null이다. */
type Preview=components['schemas']['LinkPreview'];

// 같은 주소의 카드는 한 번만 묻는다(본문을 다시 그려도, 같은 주소가 여러 번 나와도). 실패한 답은 다음에 다시 묻게 지운다.
const asked=new Map<string,Promise<Preview>>();
function previewOf(url:string){
 let found=asked.get(url);
 if(!found){found=getJson<Preview>(`/api/v1/workspace/link-previews?url=${encodeURIComponent(url)}`);asked.set(url,found);found.catch(()=>asked.delete(url));}
 return found;
}

/**
 * 링크 카드(cowork): 웹 주소 하나를 제목·설명·대표 사진이 있는 카드로 보여 준다. 그 페이지는 서버가 읽고(브라우저가
 * 남의 사이트에 직접 묻지 않는다), 읽지 못하면 주소만 있는 카드가 된다. 읽는 화면에서는 카드 전체가 새 탭으로 여는 링크이고,
 * 고치는 화면에서는 누르면 블록이 선택되며 열기·편집은 위에 뜨는 도구로 한다.
 */
export function LinkCard({url,host,editable,onEdit}:{url:string;host:string;editable:boolean;onEdit:()=>void}){
 const [preview,setPreview]=useState<Preview|null>(null),[noPicture,setNoPicture]=useState(false);
 useEffect(()=>{let live=true;setPreview(null);setNoPicture(false);previewOf(url).then(found=>{if(live)setPreview(found);}).catch(()=>{if(live)setPreview({url,site:host});});return()=>{live=false;};},[url,host]);
 const title=preview?.title||host,site=preview?.site||host;
 return <span className="link-card-box">
  {editable&&<span className="media-tools">
   <a href={url} target="_blank" rel="noopener noreferrer" aria-label="새 탭에서 열기" title="새 탭에서 열기"><ExternalLink size={14}/></a>
   <Button aria-label="링크 카드 주소 고치기" title="주소 고치기" onClick={onEdit}><Pencil size={14}/></Button>
  </span>}
  <a className="link-card" href={url} target="_blank" rel="noopener noreferrer" data-loading={preview?undefined:''} draggable={false} onClick={event=>{if(editable)event.preventDefault();}}>
   <span className="link-card-text">
    <strong className="link-card-title">{preview?title:host}</strong>
    {preview?.description&&<span className="link-card-description">{preview.description}</span>}
    <span className="link-card-site"><Globe size={13}/><span>{site}</span>{site!==host&&<span className="link-card-host">{host}</span>}</span>
   </span>
   {/* 사진 칸은 늘 둔다: 페이지가 대표 사진을 밝히지 않았거나 받지 못하면 같은 자리에 빈 칸 표시를 둬 카드 모양을 맞춘다. */}
   {preview?.image&&!noPicture?<span className="link-card-picture"><img src={preview.image} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" draggable={false} onError={()=>setNoPicture(true)}/></span>
    :<span className="link-card-picture link-card-no-picture"><Image size={20}/><span>{preview?'대표 이미지가 없습니다':'불러오는 중…'}</span></span>}
  </a>
 </span>;
}
