import { WorkflowBrand } from '@kit/foundations/brand/WorkflowBrand';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { icon } from '@kit/foundations/icons/solar-icon';
import type { ReactNode } from 'react';
import styles from '../../app/login.module.css';

/**
 * 셸 없는 인증 화면의 틀: 가운데 카드에 로고 자리, 제목, 본문. 데스크톱은 바탕 위에 올린 면(카드)이고, 휴대폰은 카드
 * 테두리 없이 화면 전체를 쓴다.
 */
export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return <main className={styles.screen} aria-label={title}>
    <div className={styles.clouds} aria-hidden><i/><i/><i/></div>
    <VStack className={styles.card} gap={6}>
      <WorkflowBrand />
      <Heading level={1}>{title}</Heading>
      {children}
    </VStack>
  </main>;
}
