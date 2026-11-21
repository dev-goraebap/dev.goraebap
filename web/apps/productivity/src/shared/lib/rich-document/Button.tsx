import type {ButtonHTMLAttributes} from 'react';
import {cn} from 'cn';
import {Button as KitButton} from '@/shared/ui/kit/button';

/**
 * 본문 편집기 안의 작은 단추(키트 Button, sm). primary는 주 동작, bordered는 테두리 단추, 그 밖은 바탕 없는 단추다. active는 켜진
 * 도구의 모양(한 단계 진한 바탕)만 두고 aria-pressed는 부르는 쪽이 정한다. 크기·글자는 놓인 자리의 편집기 규칙(styles.css)이 맞춘다.
 */
export function Button({active,primary,bordered,className,type='button',...props}:ButtonHTMLAttributes<HTMLButtonElement>&{active?:boolean;primary?:boolean;bordered?:boolean}){
 return <KitButton type={type} size="sm" variant={primary?'default':bordered?'outline':'ghost'}
  className={cn(active&&'is-active bg-pressed text-foreground',className)} {...props}/>;
}
