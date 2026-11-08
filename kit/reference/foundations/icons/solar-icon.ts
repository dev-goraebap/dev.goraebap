import { createElement, type ComponentType, type SVGProps } from 'react';
import styles from './solar-icon.module.css';
import { SOLAR_ICONS, type IconName } from './solar-icons';

export type { IconName };
type SolarComponent = ComponentType<SVGProps<SVGSVGElement>>;
const made = new Map<string, SolarComponent>();

/**
 * 의미 이름의 Solar 아이콘을 Astryx가 받는 아이콘 부품(IconType)으로 만든다. 기본은 Linear, isChosen이면 같은 아이콘의
 * Bold Duotone(눌림·열림·선택·현재 위치)이다. Bold Duotone이 없는 이름은 Linear로 그린다.
 * 기본 16px: 13px 글자 옆에서 약 1.2배. 다른 크기가 필요한 곳은 클래스로 정한다. 장식이라 접근성 트리에서 숨긴다.
 */
export function solarIcon(name: IconName, isChosen = false): SolarComponent {
  const key = `${name}:${isChosen}`;
  const known = made.get(key);
  if (known) return known;
  const pair: readonly string[] = SOLAR_ICONS[name];
  const body = isChosen && pair[1] ? pair[1] : pair[0];
  const Icon: SolarComponent = ({ className, ...props }) => createElement('svg', {
    viewBox: '0 0 24 24', width: '1rem', height: '1rem', 'aria-hidden': true, focusable: false, ...props,
    className: className ? `${styles.icon} ${className}` : styles.icon, dangerouslySetInnerHTML: { __html: body },
  });
  Icon.displayName = `Solar(${name})`;
  made.set(key, Icon);
  return Icon;
}

/** JSX 자리에 바로 두는 아이콘 요소. */
export function icon(name: IconName, isChosen = false) {
  return createElement(solarIcon(name, isChosen));
}
