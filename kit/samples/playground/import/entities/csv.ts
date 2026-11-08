import { fields, type CustomerInput, type FieldId } from './customer';

/** 파일 열 번호. 맞추지 않은 항목은 null. */
export type Mapping = Record<FieldId, number | null>;

/**
 * 모의 CSV. 실제 파일은 읽지 않고, 어떤 파일을 골라도 이 내용을 올린 것으로 본다. 오류는 이메일 형식·이름 비어 있음·날짜
 * 형식·파일 안 이메일 겹침·등급 값이 각각 한 행씩이다.
 */
export const sampleCsv = {
  headers: ['성함', '이메일 주소', '핸드폰', '가입일자', '회원 등급', '비고'],
  rows: [
    ['서윤', 'seoyun@example.com', '010-1234-5601', '2026-01-12', '일반', ''],
    ['지우', 'jiwoo@example.com', '010-1234-5602', '2026-02-03', '우수', ''],
    ['도현', 'dohyeon@example.com', '010-1234-5603', '2026-02-18', '일반', ''],
    ['민준', 'minjun.example.com', '010-1234-5604', '2026-03-02', '일반', ''],
    ['하은', 'haeun@example.com', '', '2026-03-09', 'VIP', '대리점 소개'],
    ['', 'noname@example.com', '010-1234-5606', '2026-03-15', '일반', ''],
    ['예린', 'yerin@example.com', '010-1234-5607', '2026-13-02', '일반', ''],
    ['시우', 'siu@example.com', '010-1234-5608', '2026-04-21', '일반', ''],
    ['서준', 'jiwoo@example.com', '010-1234-5609', '2026-05-04', '우수', ''],
    ['나은', 'naeun@example.com', '010-1234-5610', '2026-05-30', '우수', ''],
    ['유진', 'yujin@example.com', '010-1234-5611', '2026-06-11', '골드', ''],
    ['현우', 'hyunwoo@example.com', '010-1234-5612', '2026-07-08', '일반', ''],
    ['소율', 'soyul@example.com', '010-1234-5613', '2026-07-25', 'VIP', ''],
    ['이안', 'ian@example.com', '010-1234-5614', '2026-08-19', '일반', ''],
  ],
};

/** 열 이름으로 항목을 짐작한다. 이름이 닿지 않은 항목은 비워 두고 사람이 맞추게 한다. 한 열은 한 항목에만 쓴다. */
const aliases: Record<FieldId, string[]> = {
  name: ['이름', '성함', 'name'],
  email: ['이메일', 'email', 'mail'],
  phone: ['전화', '연락처', 'phone', 'tel'],
  joinedAt: ['가입일', '가입 날짜', 'date'],
  tier: ['등급', 'tier', 'grade'],
};
export function guessMapping(headers: string[]): Mapping {
  const taken = new Set<number>();
  const mapping = {} as Mapping;
  for (const field of fields) {
    const index = headers.findIndex((header, at) => !taken.has(at) && aliases[field.id].some(alias => header.toLowerCase().includes(alias)));
    mapping[field.id] = index >= 0 ? index : null;
    if (index >= 0) taken.add(index);
  }
  return mapping;
}

export const tiers = ['일반', '우수', 'VIP'];
const isDate = (value: string) => {
  const date = new Date(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

export type ParsedRow = { line: number; values: CustomerInput; errors: string[] };

/** 맞춘 열로 행을 읽고 행마다 오류 이유를 모은다. 줄 번호는 머리 줄을 1로 센 파일의 줄이다. */
export function readRows(mapping: Mapping): ParsedRow[] {
  const seen = new Set<string>();
  return sampleCsv.rows.map((cells, index) => {
    const pick = (id: FieldId) => (mapping[id] === null ? '' : (cells[mapping[id]!] ?? '').trim());
    const values: CustomerInput = { name: pick('name'), email: pick('email'), phone: pick('phone') || undefined, joinedAt: pick('joinedAt') || undefined, tier: pick('tier') || undefined };
    const errors: string[] = [];
    if (!values.name) errors.push('이름이 비어 있습니다');
    if (!values.email) errors.push('이메일이 비어 있습니다');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.push('이메일 형식이 올바르지 않습니다');
    else if (seen.has(values.email)) errors.push('파일 안에서 이메일이 겹칩니다');
    if (values.email) seen.add(values.email);
    if (values.joinedAt && !isDate(values.joinedAt)) errors.push('가입일 형식은 2026-03-09');
    if (values.tier && !tiers.includes(values.tier)) errors.push('등급은 일반·우수·VIP 중 하나');
    return { line: index + 2, values, errors };
  });
}

/** 가져오지 못한 행을 담은 CSV 내용(행 번호, 이름, 이메일, 이유). */
export const errorsCsv = (rows: ParsedRow[]) => ['행,이름,이메일,이유', ...rows.map(row => [row.line, row.values.name, row.values.email, row.errors.join(' / ')]
  .map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(','))].join('\n');
