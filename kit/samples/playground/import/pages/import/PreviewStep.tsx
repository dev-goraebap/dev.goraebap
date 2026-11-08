import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { HStack } from '@astryxdesign/core/HStack';
import { ListItem } from '@astryxdesign/core/List';
import { pixel, proportional, type TablePlugin } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { VStack } from '@astryxdesign/core/VStack';
import { useIsPhone } from '@kit/foundations/media';
import { PageList, PageTable } from '@kit/layouts/page/PageParts';
import { useMemo } from 'react';
import { useImportSession } from '../../app/session';
import { readRows, type ParsedRow } from '../../entities/csv';
import styles from './import.module.css';

const empty = <Text color="secondary">(비어 있음)</Text>;
const errorRows: Record<string, TablePlugin<ParsedRow>> = {
  error: { transformBodyRow: (props, row) => ({ ...props, htmlProps: { ...props.htmlProps, 'data-error': row.errors.length > 0 || undefined } }) },
};

/**
 * 3단계. 맞춘 열로 읽은 모든 행을 보이고 오류 행에는 이유를 적는다. 오류가 있으면 "오류 행 건너뛰기"를 골라야 가져올 수 있다
 * (고르지 않고 가져오기를 누르면 그 칸 곁에 알린다). 휴대폰은 표 대신 행 목록이다.
 */
export function PreviewStep({ isTried }: { isTried: boolean }) {
  const { session, update } = useImportSession();
  const isPhone = useIsPhone();
  const rows = useMemo(() => readRows(session.mapping), [session.mapping]);
  const bad = rows.filter(row => row.errors.length);
  return <VStack gap={4}>
    <Text role="status" hasTabularNumbers>전체 {rows.length}행 중 오류 {bad.length}행</Text>
    {bad.length ? <CheckboxInput label="오류 행 건너뛰기" description={`오류 ${bad.length}행을 빼고 ${rows.length - bad.length}행을 가져옵니다`}
      value={session.skipErrors} onChange={value => update({ skipErrors: value })}
      status={isTried && !session.skipErrors ? { type: 'error', message: '건너뛰거나 이전 단계에서 열을 다시 맞춰 주세요.' } : undefined} /> : null}
    {isPhone
      ? <PageList hasDividers aria-label="가져올 행">
        {rows.map(row => <ListItem key={row.line} label={<Text weight="medium" maxLines={1}>{row.values.name || '(이름 없음)'}</Text>}
          description={<Text type="supporting" color={row.errors.length ? undefined : 'secondary'} className={row.errors.length ? styles.problem : undefined}>
            {row.errors.length ? row.errors.join(', ') : row.values.email}</Text>}
          endContent={row.errors.length ? <Token label="오류" size="sm" color="red" /> : undefined} />)}
      </PageList>
      : <PageTable<ParsedRow> data={rows} textOverflow="truncate" plugins={errorRows} aria-label="가져올 행" columns={[
        { key: 'line', header: '행', width: pixel(56), renderCell: row => <Text color="secondary" hasTabularNumbers>{row.line}</Text> },
        { key: 'name', header: '이름', width: pixel(96), renderCell: row => row.values.name || empty },
        { key: 'email', header: '이메일', width: proportional(1), renderCell: row => <Text maxLines={1}>{row.values.email || '(비어 있음)'}</Text> },
        { key: 'phone', header: '전화번호', width: pixel(132), renderCell: row => <Text color="secondary" hasTabularNumbers>{row.values.phone ?? ''}</Text> },
        { key: 'joinedAt', header: '가입일', width: pixel(110), renderCell: row => <Text color="secondary" hasTabularNumbers>{row.values.joinedAt ?? ''}</Text> },
        { key: 'tier', header: '등급', width: pixel(72), renderCell: row => <Text color="secondary">{row.values.tier ?? ''}</Text> },
        { key: 'status', header: '상태', width: proportional(2), renderCell: row => row.errors.length
          ? <HStack gap={2} vAlign="center" wrap="nowrap"><Token label="오류" size="sm" color="red" /><Text className={styles.problem} maxLines={1}>{row.errors.join(', ')}</Text></HStack>
          : <Text color="secondary">정상</Text> },
      ]} />}
  </VStack>;
}
