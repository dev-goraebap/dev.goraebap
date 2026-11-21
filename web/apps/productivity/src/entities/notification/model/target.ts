import { inAppLink } from './kinds';

/** What a notice points to, read from its link: a work item. */
export type NoticeTarget = { projectKey: string; number: number };

const REF = /^([A-Za-z0-9]{2,10})-(\d+)$/;

/** The address's parts matched against a shape, the key and number captured. */
const PATHS: { shape: RegExp; read: (match: RegExpExecArray) => NoticeTarget | undefined }[] = [
  {
    // 알림에 남은 링크는 옛 주소일 수 있다(공간 접두가 붙기 전): 둘 다 읽는다.
    shape: /^(?:\/workspace)?\/(?:work-items|issues)\/([^/]+)$/,
    read: match => {
      const ref = REF.exec(match[1]!);
      return ref ? { projectKey: ref[1]!.toUpperCase(), number: Number(ref[2]) } : undefined;
    },
  },
  {
    shape: /^(?:\/workspace)?\/projects\/([A-Za-z0-9]{2,10})\/(?:work-items|issues)\/(\d+)$/,
    read: match => ({ projectKey: match[1]!.toUpperCase(), number: Number(match[2]) }),
  },
];

/**
 * The work item a notice's link points to (by reference, under a project, or the old issues addresses), so its detail
 * can show it in place. Nothing for a link elsewhere, or none. Pure: it reads the link alone.
 */
export function targetOf(link?: string): NoticeTarget | undefined {
  const href = inAppLink(link);
  if (!href) return undefined;
  const path = new URL(href, 'http://cowork.invalid').pathname.replace(/\/+$/, '') || '/';
  for (const { shape, read } of PATHS) {
    const match = shape.exec(path);
    if (match) return read(match);
  }
  return undefined;
}
