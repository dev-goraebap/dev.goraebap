import { createContext, useContext } from 'react';

/** 로그인 앱이 서버에 요청하는 일. 화면은 이 모양만 안다. */
export type AuthApi = {
  /** 맞는 이메일과 비밀번호면 계정 이름을, 아니면 InvalidCredentials를 던진다. */
  signIn: (email: string, password: string) => Promise<{ name: string }>;
  /** 가입 여부와 관계없이 같게 끝난다(계정 존재를 알리지 않는다). */
  requestReset: (email: string) => Promise<void>;
  signUp: (name:string,email:string,password:string) => Promise<void>;
  requestCode: (email:string) => Promise<void>;
  verifyCode: (email:string,code:string) => Promise<{name:string}>;
};

/** 이메일 또는 비밀번호가 맞지 않음. 어느 쪽이 틀렸는지는 담지 않는다. */
export class InvalidCredentials extends Error {
  constructor() { super('invalid credentials'); }
}

export const AuthApiContext = createContext<AuthApi | null>(null);

export function useAuthApi() {
  const api = useContext(AuthApiContext);
  if (!api) throw new Error('AuthApiContext가 필요합니다.');
  return api;
}
