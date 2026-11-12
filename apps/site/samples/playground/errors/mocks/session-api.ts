import { SessionExpired, WrongPassword, type SessionApi } from '../entities/session';

/** 모의 계정. 화면과 견본 어디에도 비밀번호를 적지 않고, 검사는 이 값을 읽어 쓴다. */
export const account = { email: 'seoyun@example.com', name: '서윤', secret: 'sample-secret-1' } as const;

const wait = (ms: number) => new Promise<void>(resolve => { setTimeout(resolve, ms); });

/**
 * 모의 서버. isExpired면 세션이 이미 끊긴 상태로 시작하고, retriesUntilUp번째 점검 확인부터 서비스가 열린다
 * (1이면 첫 확인에서 바로 열린다).
 */
export function createSessionApi({ delay = 0, isExpired = false, retriesUntilUp = 2, canRequest = true }: {
  delay?: number; isExpired?: boolean; retriesUntilUp?: number; canRequest?: boolean;
} = {}): SessionApi {
  let expired = isExpired;
  let checks = 0;
  const alive = () => { if (expired) throw new SessionExpired(); };
  return {
    account: { email: account.email, name: account.name },
    async ping() { await wait(delay); alive(); },
    async saveNote() { await wait(delay); alive(); },
    async signIn(password) {
      await wait(delay);
      if (password !== account.secret) throw new WrongPassword();
      expired = false;
    },
    async requestAccess() {
      await wait(delay);
      if (!canRequest) throw new Error('request failed');
    },
    async checkService() {
      await wait(delay);
      checks += 1;
      return checks >= retriesUntilUp ? 'up' : 'maintenance';
    },
    expire() { expired = true; },
  };
}
