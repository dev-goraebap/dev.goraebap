import { createContext, useContext } from 'react';
import type { Crumb } from '@/shared/ui/nav-icon';

/**
 * 지금 페이지의 머리 경로. 메뉴(shared/config/nav의 crumbsOf)와 프로젝트 이름으로 app의 틀(AppShellLayout)이 정해 내려 주고,
 * 각 페이지는 읽기만 한다.
 */
const PageCrumbs = createContext<Crumb[]>([]);

export const PageCrumbsProvider = PageCrumbs.Provider;

export const useCrumbs = () => useContext(PageCrumbs);
