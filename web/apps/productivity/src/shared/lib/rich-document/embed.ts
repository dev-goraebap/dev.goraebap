export function embedURL(source:string):{url:string;original:string;host:string}{
 let parsed:URL;try{parsed=new URL(source.trim());}catch{throw Error('https://로 시작하는 웹 주소를 입력하세요.');}
 if(parsed.protocol!=='https:'||parsed.username||parsed.password)throw Error('로그인 정보가 없는 HTTPS 주소를 입력하세요.');
 if(typeof location!=='undefined'&&parsed.origin===location.origin)throw Error('현재 문서 편집기 자체는 임베드할 수 없습니다.');
 const host=parsed.hostname.toLowerCase();let url=parsed.href;
 if(host==='youtu.be'||['youtube.com','www.youtube.com','m.youtube.com','www.youtube-nocookie.com'].includes(host)){
   const id=host==='youtu.be'?parsed.pathname.slice(1):parsed.searchParams.get('v')??parsed.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];
   if(id&&/^[\w-]{11}$/.test(id))url=`https://www.youtube-nocookie.com/embed/${id}`;
 }
 if(host==='vimeo.com'||host==='www.vimeo.com'){const id=parsed.pathname.match(/^\/(\d+)\/?$/)?.[1];if(id)url=`https://player.vimeo.com/video/${id}`;}
 return {url,original:parsed.href,host};
}
