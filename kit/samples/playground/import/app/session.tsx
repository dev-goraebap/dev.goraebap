import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { guessMapping, readRows, sampleCsv, type Mapping, type ParsedRow } from '../entities/csv';

export type ImportResult = { imported: number; skipped: ParsedRow[] };
export type ImportSession = { file?: { name: string; size: number }; mapping: Mapping; skipErrors: boolean; result?: ImportResult };

/** 견본이 단계 중간에서 시작할 때 쓰는 미리 채운 상태. */
export type ImportPreset = 'file' | 'done';

const demoFile = { name: '고객 목록.csv', size: 12_400 };
export function initialSession(preset?: ImportPreset): ImportSession {
  const mapping = guessMapping(sampleCsv.headers);
  if (!preset) return { mapping, skipErrors: false };
  const rows = readRows(mapping);
  const skipped = rows.filter(row => row.errors.length);
  return { file: demoFile, mapping, skipErrors: preset === 'done', result: preset === 'done' ? { imported: rows.length - skipped.length, skipped } : undefined };
}

const SessionContext = createContext<{ session: ImportSession; pickFile: (file: { name: string; size: number }) => void; update: (patch: Partial<ImportSession>) => void; reset: () => void } | null>(null);

/**
 * 가져오기 한 번의 작업 상태: 올린 파일, 맞춘 열, 오류 건너뛰기 선택, 결과. 단계는 주소가 가지고 이 값은 라우터보다 위에서
 * 단계를 오가는 동안 남는다. 새로고침하면 사라지며 그러면 처음 단계로 돌아간다.
 */
export function ImportSessionProvider({ preset, children }: { preset?: ImportPreset; children: ReactNode }) {
  const [session, setSession] = useState(() => initialSession(preset));
  const update = useCallback((patch: Partial<ImportSession>) => setSession(current => ({ ...current, ...patch })), []);
  const pickFile = useCallback((file: { name: string; size: number }) => setSession({ file, mapping: guessMapping(sampleCsv.headers), skipErrors: false }), []);
  const reset = useCallback(() => setSession(initialSession()), []);
  const value = useMemo(() => ({ session, pickFile, update, reset }), [session, pickFile, update, reset]);
  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useImportSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('ImportSessionProvider가 필요합니다.');
  return value;
}
