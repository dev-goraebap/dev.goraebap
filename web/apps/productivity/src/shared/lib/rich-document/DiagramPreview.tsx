import {usePreview} from './rich-nodes';

/** 화면 설정의 도표 그림체 미리보기(Linear의 Diagram style 견본과 같은 모양의 도표). */
const SAMPLE=`flowchart LR
  subgraph 계획
    A[아이디어] --> B{범위가 넓어지나?}
    B -- 예 --> A
  end
  B -- 아니오 --> C[사이클 시작]`;

/** 지금 고른 그림체 · 라이트 · 다크로 그린 견본 도표. 그림체를 바꾸면 새 그림이 준비될 때까지 지금 그림을 둔다. */
export function DiagramPreview({label='도표 그림체 미리보기'}:{label?:string}){
 const {html,error}=usePreview('mermaidBlock',SAMPLE);
 if(error)return <p className="text-sm text-muted-foreground">{error}</p>;
 // 그림은 Mermaid가 strict 보안 수준으로 그린 SVG다(본문 도표와 같은 경로).
 return <div role="img" aria-label={label} className="flex min-h-40 items-center justify-center overflow-x-auto [&_svg]:h-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{__html:html}}/>;
}
