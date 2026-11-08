import { InvalidCredentials, type AuthApi } from '../entities/auth';

/** 모의 계정. 정해 둔 값만 로그인에 성공한다. 화면과 견본 어디에도 값을 적지 않고, 검사는 이 목록을 읽어 쓴다. */
export const accounts = [{ email: 'seoyun@example.com', name: '서윤', secret: 'sample-secret-1' }] as const;

const wait = (ms: number) => new Promise<void>(resolve => { setTimeout(resolve, ms); });

export function createAuthApi({ delay = 0 }: { delay?: number } = {}): AuthApi {
  return {
    async signIn(email, password) {
      await wait(delay);
      const found = accounts.find(each => each.email === email.trim().toLowerCase() && each.secret === password);
      if (!found) throw new InvalidCredentials();
      return { name: found.name };
    },
    async requestReset() { await wait(delay); },
  };
}
