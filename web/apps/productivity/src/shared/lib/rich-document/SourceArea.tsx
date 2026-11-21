import type {ComponentProps} from 'react';
import {cn} from 'cn';
import {Textarea} from '@/shared/ui/kit/textarea';

/**
 * 수식 · 도표 원문을 고치는 칸(키트 Textarea). 원문은 고정폭 글자로 보이고 맞춤법 검사를 하지 않는다. 바탕과 테두리는 둘러싼
 * 원문 편집 상자(.rich-source-editor)가 맡는다.
 */
export function SourceArea({className,...props}:ComponentProps<typeof Textarea>){
 return <Textarea spellCheck={false} className={cn('min-h-0 resize-y border-0 bg-transparent px-0 font-mono text-[0.8125rem] leading-[1.6] focus-visible:ring-0',className)} {...props}/>;
}
