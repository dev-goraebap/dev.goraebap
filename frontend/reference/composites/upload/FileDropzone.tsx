import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { useId, useRef, useState } from 'react';
import { icon } from '../../foundations/icons/solar-icon';
import styles from './upload.module.css';

const sizeText = (bytes: number) => bytes >= 1024 ** 2 ? `${Math.round(bytes / 1024 ** 2)}MB` : `${Math.round(bytes / 1024)}KB`;

/**
 * 파일을 고르거나 끌어다 놓는 칸. 형식·크기·빈 파일·한 개 제한을 확인하고 걸린 파일 이름을 칸 아래 알린다. 파일만
 * 끌어올 때 반응한다. 올리기는 하지 않고 고른 파일을 onPick으로 넘긴다(업로드 수명주기는 제품 계약이 정한다).
 */
export function FileDropzone({ label, accept, maxBytes, multiple = false, disabled = false, hint, onPick }: {
  label: string; accept?: string; maxBytes?: number; multiple?: boolean; disabled?: boolean; hint?: string; onPick: (files: File[]) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const hintId = useId();
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string>();
  const choose = (files: File[]) => {
    if (disabled || files.length === 0) return;
    if (!multiple && files.length > 1) { setError('파일은 한 번에 하나만 선택해 주세요.'); return; }
    const formats = accept?.toLowerCase().split(',').map(type => type.trim());
    const valid = files.filter(file => {
      const type = file.type.toLowerCase();
      const name = file.name.toLowerCase();
      return file.size > 0 && (maxBytes == null || file.size <= maxBytes) && (!formats?.length || formats.some(format =>
        format.startsWith('.') ? name.endsWith(format) : format.endsWith('/*') ? type.startsWith(format.slice(0, -1)) : type === format));
    });
    const invalid = files.filter(file => !valid.includes(file));
    setError(invalid.length ? `${invalid.map(file => file.name).join(', ')} 파일의 형식이나 크기를 확인해 주세요.` : undefined);
    if (valid.length) onPick(valid);
  };
  const note = hint ?? (maxBytes ? `파일당 최대 ${sizeText(maxBytes)}` : undefined);
  return <VStack gap={2}>
    <button type="button" className={styles.zone} disabled={disabled} data-dragging={dragging || undefined}
      aria-label={label} aria-describedby={note ? hintId : undefined} onClick={() => input.current?.click()}
      onDragOver={event => {
        if (!event.dataTransfer.types.includes('Files')) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = disabled ? 'none' : 'copy';
        if (!disabled) setDragging(true);
      }}
      onDragLeave={event => {
        if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) setDragging(false);
      }}
      onDrop={event => { event.preventDefault(); setDragging(false); choose(Array.from(event.dataTransfer.files)); }}>
      <Text as="span" className={styles.mark}>{icon('upload')}</Text>
      <Text as="span" weight="semibold">{label}</Text>
      <Text as="span" className={styles.hint}>{dragging ? '여기에 놓으세요' : '파일을 끌어다 놓거나 눌러서 선택'}</Text>
      {note ? <Text as="span" className={styles.hint} id={hintId}>{note}</Text> : null}
    </button>
    <input hidden ref={input} type="file" accept={accept} multiple={multiple} disabled={disabled}
      onChange={event => { choose(Array.from(event.currentTarget.files ?? [])); event.currentTarget.value = ''; }} />
    {error ? <Text type="supporting" role="alert">{error}</Text> : null}
  </VStack>;
}
