import { BreadcrumbItem, Breadcrumbs } from '@astryxdesign/core/Breadcrumbs';
import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VisuallyHidden } from '@astryxdesign/core/VisuallyHidden';
import type { ReactNode } from 'react';
import { icon, type IconName } from '../../foundations/icons/solar-icon';
import { useIsPhone } from '../../foundations/media';
import styles from './page.module.css';

/** 경로의 한 단계: 이름, 가는 곳(주소 또는 페이지가 직접 처리하는 onClick), 아이콘. */
export type Crumb = { label: string; href?: string; onClick?: () => void; icon?: IconName };
export const PAGE_HEADER_HEIGHT = '3.25rem';

/**
 * 페이지 머리 줄: 52px 한 줄, 좌우 16px. 시작은 경로(위 단계는 보조색, 꺾쇠, 마지막은 현재 페이지), 끝은 페이지
 * 메뉴와 동작. 경로는 줄바꿈하지 않고 마지막 단계부터 말줄임한다. 휴대폰은 현재 이름만 두고 위 단계로 가는 ←를 앞에 둔다
 * (상세는 위 단계가 없으면 onBack). 시각적 경로와 별개로 h1을 접근성 트리에 둔다.
 * Astryx LayoutHeader는 아래 여백 때문에 줄 중심이 어긋나 쓰지 않고, 구분선은 1px 테두리다.
 */
export function PageHeader({ crumbs, actions, onBack, head, appBar, hasHeading = true }: {
  crumbs: Crumb[]; actions?: ReactNode; appBar?: ReactNode; head?: ReactNode;
  /** 휴대폰 상세에서 위 단계가 없을 때의 ←. */
  onBack?: () => void;
  /** 본문이 자기 h1(상세 제목 등)을 가지면 false. */
  hasHeading?: boolean;
}) {
  const isPhone = useIsPhone();
  const last = crumbs.length - 1;
  const up = isPhone && last > 0 ? crumbs[last - 1] : undefined;
  const shown = isPhone ? crumbs.slice(last) : crumbs;
  return <HStack as="header" className={styles.header} height={PAGE_HEADER_HEIGHT} paddingInline={4} gap={appBar ? 2 : 3} hAlign="between" vAlign="center">
    <HStack className={styles.path} gap={1} vAlign="center">
      {up && (up.href || up.onClick)
        ? <Button label={up.label} tooltip={up.label} variant="ghost" size="sm" isIconOnly icon={icon('back')} href={up.href} onClick={up.onClick} />
        : onBack ? <Button label="뒤로" tooltip="뒤로" variant="ghost" size="sm" isIconOnly icon={icon('back')} onClick={onBack} /> : null}
      {head ?? <Breadcrumbs className={styles.crumbs} separator={icon('forward')}>
        {shown.map((crumb, index) => {
          const mark = crumb.icon ? icon(crumb.icon) : undefined;
          return index === shown.length - 1
            ? <BreadcrumbItem key={index} isCurrent startIcon={mark}><Text weight="semibold" maxLines={1}>{crumb.label}</Text></BreadcrumbItem>
            : <BreadcrumbItem key={index} href={crumb.href} onClick={crumb.onClick} startIcon={mark}><Text color="secondary" weight="medium" maxLines={1}>{crumb.label}</Text></BreadcrumbItem>;
        })}
      </Breadcrumbs>}
      {hasHeading && crumbs.length ? <VisuallyHidden><h1>{crumbs[last].label}</h1></VisuallyHidden> : null}
    </HStack>
    {actions || appBar ? <HStack className={styles.headEnd} gap={1.5} vAlign="center">{actions}{appBar}</HStack> : null}
  </HStack>;
}
