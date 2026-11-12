import { NOW, PAGE, kinds, actors, type Activity, type ActivityApi, type ActivityKind } from '../entities/activity';

const targets = ['가을 캠페인 일정', '가입 흐름 점검', '알림 설정 화면', '분기 예산안', '주간 회고', '접근성 점검표', '배포 체크리스트', '문구 사전',
  '온보딩 문서', '색 토큰 정리', '고객 인터뷰 요약', '릴리스 노트'];
const order = Object.keys(kinds) as ActivityKind[];

/** 시간이 갈수록 간격이 벌어지는 기록 46건: 오늘 5건, 이번 주 안에 21건, 30일을 넘는 것이 끝에 있다. */
export const seedActivities: Activity[] = Array.from({ length: 46 }, (_, index) => ({
  id: `a${index + 1}`,
  actor: actors[(index * 3) % 5],
  kind: order[(index * 7) % 5],
  target: targets[(index * 5) % targets.length],
  at: new Date(Date.parse(NOW) - (20 + index * index * 22 + index * 60) * 60_000).toISOString(),
}));

const DAY = 86_400_000;
const since = (period?: string) => {
  const now = Date.parse(NOW);
  return period === 'today' ? Date.parse(NOW.slice(0, 10)) : period === 'week' ? now - 7 * DAY : period === 'month' ? now - 30 * DAY : undefined;
};

/** 메모리에만 있는 모의 저장소. 조건을 걸러 한 조각씩 돌려주며(서버가 거른다), 견본마다 새로 만든다. */
export function createActivityApi({ delay = 120, fail = false, initial = seedActivities }: { delay?: number; fail?: boolean; initial?: Activity[] } = {}): ActivityApi {
  return {
    async list(conditions, offset, signal) {
      signal?.throwIfAborted();
      await new Promise<void>(resolve => setTimeout(resolve, delay));
      signal?.throwIfAborted();
      if (fail) throw new Error('활동 기록을 불러오지 못했습니다.');
      const from = since(conditions.period);
      const kept = initial.filter(each => (from === undefined || Date.parse(each.at) >= from)
        && (!conditions.actors.length || conditions.actors.includes(each.actor)) && (!conditions.kinds.length || conditions.kinds.includes(each.kind)))
        .sort((a, b) => b.at.localeCompare(a.at));
      return { items: kept.slice(offset, offset + PAGE), total: kept.length };
    },
  };
}
