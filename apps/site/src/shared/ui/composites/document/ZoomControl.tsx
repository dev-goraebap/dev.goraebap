import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Selector } from '@astryxdesign/core/Selector';
import { Text } from '@astryxdesign/core/Text';
import styles from './document.module.css';

/** 'fit'은 칸 폭에 맞춘 배율(넓으면 100%), 숫자는 고정 배율(%). */
export type ZoomSetting = 'fit' | number;
const STEPS = [50, 75, 90, 100, 110, 125, 150, 200];

/** 확대/축소: −, 배율 고르기(폭에 맞춤·단계), +. 폭에 맞춤일 때는 지금 실제 배율(current)만 짧게 보인다. */
export function ZoomControl({ value, current, onChange }: { value: ZoomSetting; current: number; onChange: (value: ZoomSetting) => void }) {
  const percent = Math.round(current * 100);
  const step = (direction: 1 | -1) => {
    const next = direction > 0 ? STEPS.find(each => each > percent) : [...STEPS].reverse().find(each => each < percent);
    if (next) onChange(next);
  };
  return <HStack className={styles.zoom} gap={0.5} vAlign="center" role="group" aria-label="확대/축소">
    <Button label="축소" tooltip="축소" variant="ghost" size="sm" isIconOnly icon={<Text aria-hidden className={styles.zoomGlyph}>−</Text>}
      isDisabled={percent <= STEPS[0]} onClick={() => step(-1)} />
    <Selector label="배율" isLabelHidden size="sm" variant="ghost" value={value === 'fit' ? 'fit' : String(value)} onChange={next => onChange(next === 'fit' ? 'fit' : Number(next))}
      options={[{ value: 'fit', label: value === 'fit' ? `${percent}%` : '폭에 맞춤' }, ...STEPS.map(each => ({ value: String(each), label: `${each}%` }))]} />
    <Button label="확대" tooltip="확대" variant="ghost" size="sm" isIconOnly icon={<Text aria-hidden className={styles.zoomGlyph}>+</Text>}
      isDisabled={percent >= STEPS[STEPS.length - 1]} onClick={() => step(1)} />
  </HStack>;
}
