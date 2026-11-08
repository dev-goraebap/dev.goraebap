import { InvalidCredentials, type AuthApi } from '../entities/auth';

/** 모의 계정. 정해 둔 값만 로그인에 성공한다. 화면과 견본 어디에도 값을 적지 않고, 검사는 이 목록을 읽어 쓴다. */
export const accounts = [{ email: 'seoyun@example.com', name: '서윤', secret: 'sample-secret-1' }] as const;

const wait = (ms: number) => new Promise<void>(resolve => { setTimeout(resolve, ms); });

export function createAuthApi({ delay = 0 }: { delay?: number } = {}): AuthApi {
  const members: {email:string;name:string;secret:string}[] = [...accounts];
  const codes=new Set<string>();
  return {
    async signIn(email, password) {
      await wait(delay);
      const found = members.find(each => each.email === email.trim().toLowerCase() && each.secret === password);
      if (!found) throw new InvalidCredentials();
      return { name: found.name };
    },
    async signUp(name,email,password){ await wait(delay);if(members.some(m=>m.email===email))throw new Error('이미 가입한 이메일입니다.');members.push({name,email,secret:password});codes.add(email); },
    async requestCode(email){await wait(delay);codes.add(email);},
    async verifyCode(email,code){await wait(delay);if(!codes.has(email)||code!==sampleCode)throw new Error('인증 코드가 맞지 않거나 만료되었습니다.');codes.delete(email);return {name:members.find(m=>m.email===email)?.name??'서윤'};},
    async requestReset() { await wait(delay); },
  };
}

export const sampleCode="123456";
