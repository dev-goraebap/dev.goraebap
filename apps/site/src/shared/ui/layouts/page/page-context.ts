import { createContext, type ReactNode } from 'react';

/** 휴대폰 일반 페이지의 머리 줄 끝에 셸이 넣는 앱 도구(검색·알림·내 메뉴). 머리 줄을 따로 두지 않고 공유한다. */
export const PageAppBarContext = createContext<ReactNode>(null);

/** 페이지 전체 상태·오류 줄(PageBanner)이 들어갈 머리 아래 자리. 페이지 밖에서는 null. */
export const PageBannerContext = createContext<HTMLElement | null>(null);

/**
 * 셸이 휴대폰 페이지에 빌려주는 것: 상세·양식은 하단 탭을 치운 전체 화면이 된다. 셸 밖에서는 null.
 */
export const PageChromeContext = createContext<{ setFull: (isFull: boolean) => void } | null>(null);

/** 휴대폰 상세·양식의 바닥 고정 동작 줄(PageActions가 들어갈 자리). 다른 곳에서는 null. */
export const PageFootContext = createContext<HTMLElement | null>(null);
