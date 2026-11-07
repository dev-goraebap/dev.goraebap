import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Switch } from '@astryxdesign/core/Switch';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { useState, type KeyboardEvent, type ReactNode } from 'react';
import { AlertDialog } from '../../composites/dialog/AlertDialog';
import { AppDialog } from '../../composites/dialog/AppDialog';
import { icon } from '../../foundations/icons/solar-icon';
import { useIsPhone } from '../../foundations/media';
import { Page } from '../../layouts/page/Page';
import type { Crumb } from '../../layouts/page/PageHeader';
import { ComposePillsContext } from './ComposeForm';
import styles from './compose.module.css';

/** 제출은 비활성화하지 않는다. 빠진 값은 onSubmit에서 검사해 곁에 알리고 초점을 옮긴다(focusFirstInvalid). */
export type ComposeSubmit = { label: string; onSubmit: () => void; isPending?: boolean };

/**
 * ComposeForm이 놓이는 곳. 데스크톱 목록에서 열면 대화상자(머리에 만들 곳 칩·크게 보기·닫기), 직접 진입·새로고침·크게
 * 보기와 휴대폰은 자기 페이지다. 바닥은 계속 만들기(선택)와 제출, Ctrl/⌘+Enter도 제출한다(한글 조합 중 제외).
 * 휴대폰은 본문만 스크롤하고 속성 알약을 바닥 동작 위 고정 줄에 둔다.
 * 입력이 있는 채로 닫기·Esc·배경·취소·←를 누르면 버릴지 묻는다. 크게 보기는 같은 초안을 페이지로 옮기므로 묻지 않는다.
 */
export function ComposeSurface({ surface, crumbs, chip, isDirty = false, isContinuing, onContinuing, submit, actions, error, onClose, onExpand, children }: {
  surface: 'dialog' | 'page';
  /** 페이지 경로. 마지막 단계가 양식 이름(새 자료). */
  crumbs: Crumb[];
  /** 만들 곳(대화상자 머리). */
  chip?: ReactNode;
  /** 버릴 입력이 있는가. 있으면 닫기 전에 확인한다. */
  isDirty?: boolean;
  isContinuing?: boolean;
  onContinuing?: (isContinuing: boolean) => void;
  submit: ComposeSubmit;
  /** 바닥 시작의 다른 동작(임시 저장 등). */
  actions?: ReactNode;
  error?: string;
  onClose: () => void;
  onExpand?: () => void;
  children: ReactNode;
}) {
  const isPhone = useIsPhone();
  const [isAsking, setAsking] = useState(false);
  const requestClose = () => { if (submit.isPending) return; if (isDirty) setAsking(true); else onClose(); };
  const press = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !event.nativeEvent.isComposing && !submit.isPending) {
      event.preventDefault();
      submit.onSubmit();
    }
  };
  const confirm = <AlertDialog isOpen={isAsking} onOpenChange={setAsking} title="작성 중인 내용을 버릴까요?"
    description="닫으면 입력한 제목과 본문, 속성이 사라집니다." cancelLabel="계속 작성" actionLabel="버리기"
    onAction={() => { setAsking(false); onClose(); }} />;
  const errorText = error ? <Text className={styles.error} role="alert" maxLines={2}>{error}</Text> : null;
  const continuing = onContinuing ? <Switch label="계속 만들기" size="sm" value={isContinuing ?? false} onChange={onContinuing} /> : null;
  const extra = actions ? <HStack className={styles.actions} gap={1} vAlign="center">{actions}</HStack> : null;
  if (isPhone) return <PhoneCompose crumbs={crumbs} chip={chip} onBack={requestClose} onKeyDown={press}
    foot={<VStack as="footer" className={styles.phoneFoot} gap={2}>
      {errorText}{continuing}
      <HStack gap={2} hAlign="end" vAlign="center" wrap="wrap">
        {extra}
        <Button label="취소" variant="ghost" onClick={requestClose} />
        <Button label={submit.label} variant="primary" isLoading={submit.isPending} onClick={submit.onSubmit} />
      </HStack>
    </VStack>}>{children}{confirm}</PhoneCompose>;
  const foot = <HStack gap={3} hAlign="end" vAlign="center" wrap="wrap">
    {extra}{errorText}{continuing}
    {surface === 'page' ? <Button label="취소" variant="ghost" size="sm" onClick={requestClose} /> : null}
    <Button label={submit.label} variant="primary" size="sm" tooltip="Ctrl + Enter" isLoading={submit.isPending}
      onClick={submit.onSubmit} />
  </HStack>;
  if (surface === 'page') return <Page crumbs={crumbs} isDetail hasPattern={false}>
    <HStack hAlign="center" paddingInline={4} paddingBlock={8} onKeyDown={press}>
      <VStack width="100%" maxWidth="45rem" gap={6}>
        {chip ? <HStack>{chip}</HStack> : null}
        {children}
        {foot}
      </VStack>
    </HStack>
    {confirm}
  </Page>;
  return <>
    <AppDialog isOpen title={crumbs.at(-1)?.label ?? '작성'} onOpenChange={isOpen => { if (!isOpen) requestClose(); }}
      purpose="form" width="min(45rem, 100vw - 3rem)" headerLeading={chip} footer={foot} onFrameKeyDown={press} focusTitle={false}
      headerActions={onExpand ? <IconButton label="크게 보기" tooltip="크게 보기" variant="ghost" size="sm" icon={icon('expand-page')} onClick={onExpand} /> : null}>
      {children}
    </AppDialog>
    {confirm}
  </>;
}

/** 만들 곳: 대화상자 머리의 작은 칩. */
export function PlaceChip({ mark, label }: { mark: ReactNode; label: string }) {
  return <HStack className={styles.chip} gap={1} vAlign="center">{mark}<Text className={styles.chipText} maxLines={1}>{label}</Text></HStack>;
}

function PhoneCompose({ crumbs, chip, foot, onBack, onKeyDown, children }: {
  crumbs: Crumb[]; chip?: ReactNode; foot: ReactNode; onBack: () => void; onKeyDown: (event: KeyboardEvent) => void; children: ReactNode;
}) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  return <ComposePillsContext value={slot}>
    <Page crumbs={crumbs} isDetail onBack={onBack} aboveFooter={<HStack ref={setSlot} className={styles.phonePills} />} footer={foot}>
      <VStack paddingInline={4} paddingBlock={5} gap={5} onKeyDown={onKeyDown}>
        {chip ? <HStack>{chip}</HStack> : null}
        {children}
      </VStack>
    </Page>
  </ComposePillsContext>;
}
