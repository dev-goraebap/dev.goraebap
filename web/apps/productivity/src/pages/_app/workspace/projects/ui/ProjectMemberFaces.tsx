import { cn } from 'cn';
import type { Project } from '@/entities/project';
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from '@/shared/ui/kit/popover';
import { PersonAvatar } from '@/shared/ui/person';

/** 한 칸에 겹쳐 그리는 멤버 사진 수. 넘치면 '외 N명'. */
const FACES = 3;

/**
 * 프로젝트의 멤버들(Linear 팀 표의 Members): 사진을 셋까지 겹쳐 그리고 나머지는 '외 N명'. 누르면 모든 멤버의 목록이 뜬다
 * (2026-11-15). 표는 데스크톱에만 있어 목록은 팝오버다.
 */
export function ProjectMemberFaces({ project, people }: { project: Project; people: { id: string; name: string }[] }) {
  if (people.length === 0) return <span className="text-muted-foreground">-</span>;
  const rest = people.length - FACES;
  return (
    <Popover>
      <PopoverTrigger render={
        <button type="button" aria-label={`${project.name} 멤버 ${people.length}명 보기`}
          className="relative z-1 inline-flex h-7 items-center rounded-md px-1 outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
          {people.slice(0, FACES).map((person, index) => (
            <span key={person.id} className={cn('rounded-full ring-2 ring-background', index > 0 && '-ml-1.5')}><PersonAvatar id={person.id} name={person.name} size={20} isStatic /></span>
          ))}
          {rest > 0 ? <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">외 {rest}명</span> : null}
        </button>
      } />
      <PopoverContent align="start" className="w-64 gap-1.5">
        <PopoverHeader><PopoverTitle>{`${project.name} 멤버 ${people.length}명`}</PopoverTitle></PopoverHeader>
        <ul aria-label="멤버" className="flex max-h-72 flex-col overflow-y-auto">
          {people.map(person => (
            <li key={person.id} className="flex min-h-9 items-center gap-2">
              <PersonAvatar id={person.id} name={person.name} size={20} isStatic />
              <span className="truncate">{person.name}</span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
