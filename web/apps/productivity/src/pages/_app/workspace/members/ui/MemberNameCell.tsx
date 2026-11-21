import type { OrgPerson } from '@/entities/organization';
import { PersonAvatar } from '@/shared/ui/person';

/** 이름 칸: 사진과 이름. 이름 단추가 줄 전체를 덮어(::after) 어디를 눌러도 프로필이 열린다. */
export function MemberNameCell({ person, onOpen }: { person: OrgPerson; onOpen: () => void }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <PersonAvatar id={person.id} name={person.name} size={20} isStatic />
      <button type="button" aria-label={`${person.name} 프로필 열기`} onClick={onOpen}
        className="truncate font-medium outline-none after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring">
        {person.name}
      </button>
    </span>
  );
}
