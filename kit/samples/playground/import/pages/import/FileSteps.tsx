import { IconButton } from '@astryxdesign/core/IconButton';
import { ListItem } from '@astryxdesign/core/List';
import { Selector } from '@astryxdesign/core/Selector';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { FileDropzone } from '@kit/composites/upload/FileDropzone';
import { icon } from '@kit/foundations/icons/solar-icon';
import { PageList } from '@kit/layouts/page/PageParts';
import { useImportSession } from '../../app/session';
import { sampleCsv } from '../../entities/csv';
import { fields } from '../../entities/customer';
import styles from './import.module.css';

const sizeText = (bytes: number) => bytes >= 1024 ** 2 ? `${(bytes / 1024 ** 2).toFixed(1)}MB` : `${Math.max(1, Math.round(bytes / 1024))}KB`;

/**
 * 1단계. 파일을 올리면 올린 파일 한 줄로 바뀌고 읽은 행·열 수를 알린다(파일 바꾸기는 줄 끝의 ×). 올리기 전에 다음을 누르면
 * 올리는 칸 곁에 알린다. 이 예제는 파일 내용을 읽지 않고 모의 CSV를 올린 것으로 본다.
 */
export function UploadStep({ isTried }: { isTried: boolean }) {
  const { session, pickFile, update } = useImportSession();
  if (session.file) return <PageList hasDividers aria-label="올린 파일">
    <ListItem label={<Text weight="medium" maxLines={1}>{session.file.name}</Text>}
      description={<Text type="supporting" color="secondary" hasTabularNumbers>{sizeText(session.file.size)} · {sampleCsv.rows.length}행 · {sampleCsv.headers.length}열</Text>}
      startContent={<span className={styles.mark}>{icon('document')}</span>}
      endContent={<IconButton label={`${session.file.name} 빼기`} tooltip="파일 바꾸기" variant="ghost" size="sm" icon={icon('close')}
        onClick={() => update({ file: undefined, result: undefined })} />} />
  </PageList>;
  return <VStack gap={2}>
    <FileDropzone label="CSV 파일 올리기" accept=".csv,text/csv" maxBytes={5 * 1024 ** 2} hint="CSV 파일, 최대 5MB · 첫 줄은 열 이름" onPick={files => pickFile({ name: files[0].name, size: files[0].size })} />
    {isTried ? <Text type="supporting" role="alert" className={styles.problem}>가져올 파일을 먼저 올려 주세요.</Text> : null}
  </VStack>;
}

/**
 * 2단계. 받을 항목마다 파일의 어느 열을 쓸지 고른다. 열 이름으로 먼저 짐작해 채우고, 짐작하지 못한 항목은 비워 둔다. 한 열은 한
 * 항목에만 쓴다(이미 쓴 열은 고를 수 없다). 필수 항목이 비면 다음에서 그 칸 곁에 알린다.
 */
export function MapStep({ isTried }: { isTried: boolean }) {
  const { session, update } = useImportSession();
  const guessed = fields.filter(field => session.mapping[field.id] !== null).length;
  const sample = (column: number) => sampleCsv.rows.map(row => row[column]).find(Boolean);
  return <VStack gap={4}>
    <Text color="secondary">파일의 열 {sampleCsv.headers.length}개 중 {guessed}개를 열 이름으로 맞췄습니다. 맞는지 확인해 주세요.</Text>
    <VStack gap={4} role="group" aria-label="열 맞추기">
      {fields.map(field => {
        const chosen = session.mapping[field.id];
        const used = new Set(Object.entries(session.mapping).filter(([id, column]) => id !== field.id && column !== null).map(([, column]) => column));
        return <Selector key={field.id} label={field.isRequired ? `${field.label} (필수)` : field.label} value={chosen === null ? 'none' : String(chosen)}
          description={chosen === null ? '가져오지 않습니다' : `예: ${sample(chosen) ?? '비어 있음'}`}
          options={[{ value: 'none', label: '가져오지 않음' }, ...sampleCsv.headers.map((header, column) => ({ value: String(column), label: header, disabled: used.has(column) }))]}
          onChange={value => update({ mapping: { ...session.mapping, [field.id]: value === 'none' ? null : Number(value) } })}
          status={isTried && field.isRequired && chosen === null ? { type: 'error', message: `${field.label}에 쓸 열을 골라 주세요.` } : undefined} />;
      })}
    </VStack>
  </VStack>;
}
