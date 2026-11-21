import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import { sessionOptions } from '@/shared/auth';
import { INSTANCE_WHERE, navPlaces } from '@/shared/config';
import { navIcon, pageCrumbs } from '@/shared/ui/nav-icon';
import { contentSources } from '../model/content';
import { matches, type SearchHit, type SearchSource } from '../model/search';
import { GlobalSearch } from './GlobalSearch';

type Crumb = { label: string; href?: string; icon?: string };

/** 아무것도 치기 전에 보이는 바로 가기: 인스턴스(탐색 · 알림함 · 내 업무)와 두 공간(오피스 · 워크스페이스)의 메뉴. */
const SHORTCUT_WHERE = [INSTANCE_WHERE, '오피스', '워크스페이스'];

/**
 * What 검색 looks through, for the member signed in: the pages of the menus they may open (메뉴), found by name and by
 * where they stand, then what their spaces hold as the server finds it (업무 · 문서 · 회의록 · 일정 · 공지 · 주간보고).
 */
export function useSearchSources() {
  const roles = useQuery(sessionOptions()).data?.roles;
  return useMemo(() => {
    const places = navPlaces(roles ?? []);
    const hit = (place: (typeof places)[number]): SearchHit => ({ id: place.path, label: place.label, where: place.where, icon: navIcon(place.icon), href: place.path });
    const sources: SearchSource[] = [{
      id: 'pages', title: '메뉴',
      find: words => places.filter(place => matches(`${place.label} ${place.where}`, words)).map(hit),
    }, ...contentSources(navIcon)];
    // 두 공간에 같은 메뉴(알림함)가 있으면 한 번만.
    const shortcuts = places.filter(place => SHORTCUT_WHERE.includes(place.where))
      .filter((place, index, list) => list.findIndex(other => other.path === place.path) === index).map(hit);
    return { sources, shortcuts };
  }, [roles]);
}

/**
 * 검색 on its own page (/search): where a phone opens it, and a link, a reload or 크게 보기 (a desktop opens it as a dialog
 * over the page in view, app's panel host). Going to a hit leaves for it; 닫기 goes back.
 */
export function SearchPage({ crumbs }: { crumbs: Crumb[] }) {
  const navigate = useNavigate();
  const { sources, shortcuts } = useSearchSources();
  return <GlobalSearch surface="page" crumbs={pageCrumbs(crumbs)} sources={sources} shortcuts={shortcuts}
    onGo={href => void navigate({ href })} onClose={() => window.history.back()} />;
}
