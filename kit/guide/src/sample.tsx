import { createRoot } from 'react-dom/client';
import { SampleFrame } from './samples/SampleFrame';

// 견본 하나를 가이드와 분리된 문서로 그린다. 가이드 본문은 sample.html?id=…를 iframe으로 띄우고, 새 창에서도 열 수 있다.
const id = new URLSearchParams(location.search).get('id') ?? '';
createRoot(document.getElementById('sample-root')!).render(<SampleFrame id={id} />);
