import { createContext, useContext } from 'react';

/** 오류·권한 앱이 서버에 요청하는 일. */
export type SessionApi = {
  /** 로그인한 계정. 세션 만료 대화상자가 이메일을 보여 준다. */
  account: { email: string; name: string };
  /** 세션이 살아 있는지 확인한다. 만료됐으면 SessionExpired. */
  ping: () => Promise<void>;
  /** 메모 저장. 만료됐으면 SessionExpired. */
  saveNote: (input: { title: string; body: string }) => Promise<void>;
  /** 같은 계정으로 다시 로그인한다. 맞지 않으면 WrongPassword. */
  signIn: (password: string) => Promise<void>;
  /** 문서 열람 권한을 요청한다. */
  requestAccess: (documentId: string) => Promise<void>;
  /** 서비스 상태. 점검 중이면 'maintenance'. */
  checkService: () => Promise<'up' | 'maintenance'>;
  /** 시간이 지나 세션이 끊긴 것을 흉내 낸다. */
  expire: () => void;
};

export class SessionExpired extends Error {
  constructor() { super('session expired'); }
}
export class WrongPassword extends Error {
  constructor() { super('wrong password'); }
}

export const SessionApiContext = createContext<SessionApi | null>(null);

export function useSessionApi() {
  const api = useContext(SessionApiContext);
  if (!api) throw new Error('SessionApiContext가 필요합니다.');
  return api;
}

/** 요청을 만료 처리로 감싸는 함수. 만료되면 다시 로그인한 뒤 같은 요청을 이어서 보낸다. */
export type Guard = <T>(run: () => Promise<T>) => Promise<T>;
export const GuardContext = createContext<Guard>(run => run());
export const useGuard = () => useContext(GuardContext);
