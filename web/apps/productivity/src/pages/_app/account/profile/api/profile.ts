import { sendCommand } from '@/shared/api';

/** 내가 쓰는 이름을 바꾼다. 다른 사람에게는 다음에 읽을 때부터 보인다. */
export const changeMyName = (name: string) => sendCommand('/api/v1/me/name', 'PUT', { name });
