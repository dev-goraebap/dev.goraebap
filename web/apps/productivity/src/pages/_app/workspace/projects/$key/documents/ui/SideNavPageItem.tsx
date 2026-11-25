import { useState } from 'react';
import type { DocumentRow } from '@/entities/document';
import { Button } from '@goraebap/ui-react/compact/button';
import { ChevronDownIcon, ChevronRightIcon } from '@/shared/ui/kit/icon';
import type { SideNavState } from '../model/side-nav';
import { SideNavPageLink } from './SideNavPageLink';

/** 페이지 하나와 그 하위. 하위가 있으면 끝에 접기 단추가 있고, 처음에는 펼쳐 둔다. */
export function SideNavPageItem({ page, nav }: { page: DocumentRow; nav: SideNavState }) {
  const [isOpen, setOpen] = useState(true);
  const children = nav.pages.filter(each => each.parentId === page.id);
  return <li className="flex flex-col gap-0.5">
    <div className="flex items-center gap-0.5">
      <SideNavPageLink page={page} nav={nav} />
      {children.length ? <Button variant="ghost" size="icon-xs" aria-expanded={isOpen} aria-label={`${page.title} 하위 페이지 ${isOpen ? '접기' : '펼치기'}`}
        className="text-icon-muted max-md:size-11" onClick={() => setOpen(!isOpen)}>
        {isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
      </Button> : null}
    </div>
    {children.length && isOpen ? <ul className="flex flex-col gap-0.5 pl-4">{children.map(child => <SideNavPageItem key={child.id} page={child} nav={nav} />)}</ul> : null}
  </li>;
}
