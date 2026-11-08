import { queryOptions } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

/** 대화방과 메시지. 메시지는 오래된 것부터 위에서 아래로 쌓이고, 보내는 중·실패는 서버에 닿기 전이라 화면이 따로 가진다. */
export type Room = { id: string; name: string; members: string[] };
export type Message = { id: string; roomId: string; author: string; body: string; sentAt: string };
/** 아직 서버에 없는 내 메시지: 보내는 중이거나 보내지 못한 것. */
export type Outgoing = { localId: string; body: string; status: 'sending' | 'failed' };

export const ME = '서윤';
/** 모의 시계. 날짜 구분의 "오늘"과 상대 시각이 실행한 날과 무관하게 같게 나오도록 고정한다. */
export const NOW = '2026-11-08T11:00:00Z';

export interface ThreadApi {
  rooms(signal?: AbortSignal): Promise<Room[]>;
  messages(roomId: string, signal?: AbortSignal): Promise<Message[]>;
  /** localId는 같은 메시지를 다시 보낼 때 같다. */
  send(roomId: string, localId: string, body: string): Promise<Message>;
}
export const ThreadApiContext = createContext<ThreadApi | null>(null);
export function useThreadApi() {
  const api = useContext(ThreadApiContext);
  if (!api) throw new Error('ThreadApiContext가 필요합니다.');
  return api;
}

export const threadKeys = { rooms: ['rooms'] as const, messages: (roomId: string) => ['messages', roomId] as const };
export const threadQueries = {
  rooms: (api: ThreadApi) => queryOptions({ queryKey: threadKeys.rooms, queryFn: ({ signal }) => api.rooms(signal), staleTime: 30_000 }),
  /** 새 글은 잠시마다 다시 읽어 온다(예제의 모의 서버가 중간에 한 건을 보낸다). */
  messages: (api: ThreadApi, roomId: string) => queryOptions({
    queryKey: threadKeys.messages(roomId), queryFn: ({ signal }) => api.messages(roomId, signal), refetchInterval: 2500,
  }),
};

const GROUP_GAP = 5 * 60_000;
const dayKey = (value: string) => value.slice(0, 10);

export type Run = { author: string; isMine: boolean; messages: Message[] };
export type Day = { key: string; label: string; runs: Run[] };

const dayFormat = new Intl.DateTimeFormat('ko', { month: 'long', day: 'numeric', weekday: 'long', timeZone: 'UTC' });
/** 날짜 구분의 이름: 오늘·어제, 그 밖은 날짜와 요일. */
export function dayLabel(key: string, now = NOW) {
  const diff = (Date.parse(dayKey(now)) - Date.parse(key)) / 86_400_000;
  if (diff === 0) return '오늘';
  if (diff === 1) return '어제';
  return dayFormat.format(new Date(key));
}

export const clockText = (value: string) => new Intl.DateTimeFormat('ko', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(new Date(value));

/** 날짜로 나누고, 같은 사람이 5분 안에 이어 쓴 메시지는 한 묶음으로 둔다. */
export function groupMessages(messages: Message[]): Day[] {
  const days: Day[] = [];
  for (const message of messages) {
    const key = dayKey(message.sentAt);
    let day = days[days.length - 1];
    if (!day || day.key !== key) { day = { key, label: dayLabel(key), runs: [] }; days.push(day); }
    const run = day.runs[day.runs.length - 1];
    const last = run?.messages[run.messages.length - 1];
    if (run && last && run.author === message.author && Date.parse(message.sentAt) - Date.parse(last.sentAt) <= GROUP_GAP) run.messages.push(message);
    else day.runs.push({ author: message.author, isMine: message.author === ME, messages: [message] });
  }
  return days;
}

/** 본문에서 방 구성원의 @이름을 가려낸다. */
export function splitMentions(body: string, members: string[]): { text: string; isMention: boolean }[] {
  const names = members.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  if (!names) return [{ text: body, isMention: false }];
  return body.split(new RegExp(`(@(?:${names}))`)).filter(Boolean).map(text => ({ text, isMention: /^@/.test(text) && members.includes(text.slice(1)) }));
}

/** 보내는 중·실패한 메시지는 방을 옮겨도 남도록 앱이 가진다. 서버에 들어가면 지운다. */
export type OutboxState = { outbox: Record<string, Outgoing[]>; setOutbox: (roomId: string, update: (list: Outgoing[]) => Outgoing[]) => void };
export const OutboxContext = createContext<OutboxState | null>(null);
export function useOutbox() {
  const value = useContext(OutboxContext);
  if (!value) throw new Error('OutboxContext가 필요합니다.');
  return value;
}
