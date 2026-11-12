import { Link, useRouter } from '@tanstack/react-router';
import logo from '@/shared/brand/logo.svg?raw';
import { paths } from '@/shared/config/paths';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

export type Area = 'blog' | 'webcraft' | 'settings';
const areas = [{ value: 'blog', label: 'Blog' }, { value: 'webcraft', label: 'Webcraft' }];

/** 로고(처음으로). 그림은 글자색으로 칠한다. */
export function Logo() {
  return <Link to={paths.blog} aria-label="dev-goraebap 처음으로"
    className="grid size-8 shrink-0 place-items-center rounded-lg text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">
    <span aria-hidden className="block size-7 [&_svg]:block [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: logo }} />
  </Link>;
}

/** 사이트 영역 고르기: Blog와 Webcraft를 오간다. 설정 안에서는 고르는 대신 '설정'이라는 이름만 둔다. */
export function AreaSwitch({ area }: { area: Area }) {
  const router = useRouter();
  if (area === 'settings') return <span className="truncate px-1 text-sm font-semibold">설정</span>;
  return <Select items={areas} value={area} onValueChange={value => { if (value) void router.navigate({ href: `/${value}/` }); }}>
    <SelectTrigger size="sm" aria-label="사이트 영역" className="w-32 max-md:h-11">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>{areas.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectGroup>
    </SelectContent>
  </Select>;
}

/** 사이드바 머리: 로고와 영역 고르기. 접힌 사이드바는 로고만. */
export function Brand({ isFolded, area }: { isFolded: boolean; area: Area }) {
  return <div className="flex min-w-0 items-center gap-2.5">
    <Logo />
    {isFolded ? null : <AreaSwitch area={area} />}
  </div>;
}
