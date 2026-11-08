import { AlertDialog } from '../dialog/AlertDialog';
import { Button } from '@astryxdesign/core/Button';
import { ChatComposer, ChatComposerInput } from '@astryxdesign/core/Chat';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { createElement, useState, type ReactNode } from 'react';
import { solarIcon } from '../../foundations/icons/solar-icon';

import { PersonAvatar } from '../../foundations/avatar/PersonAvatar';
import { ActionMenu, type MenuAction } from '../popup/ActionMenu';
import { AdaptivePopover } from '../popup/AdaptivePopover';
import styles from './activity.module.css';


export type ActivityItem = {
  id: string; kind: 'event' | 'comment'; at: string; actorId?: string; actorName?: string;
  text?: string; icon?: string; body?: string; quote?: string; editedAt?: string; parentId?: string;
  agent?: { id?: string; name?: string; icon?: string; color?: string };
};

const when = new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const moment = (at: string) => when.format(new Date(at));


export function ActivityFeed({ items, meId, canWrite, canModerate = false, error, onComment, onEdit, onDelete, onQuote }: {
  items: ActivityItem[]; meId?: string; canWrite: boolean; canModerate?: boolean;

  error?: string;

  onComment: (body: string, parentId?: string) => Promise<unknown>;
  onEdit: (id: string, body: string) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  onQuote?: (quote: string) => void;
}) {
  const [deleting, setDeleting] = useState<ActivityItem | null>(null);
  const [isBusy, setBusy] = useState(false);
  const remove = (item: ActivityItem) => {
    setBusy(true);
    onDelete(item.id).then(() => setDeleting(null), () => undefined).finally(() => setBusy(false));
  };
  // A reply stands in its comment's card; one whose comment is gone stands on its own.
  const ids = new Set(items.map(item => item.id));
  const isReply = (item: ActivityItem) => !!item.parentId && ids.has(item.parentId);
  const repliesOf = (id: string) => items.filter(item => item.parentId === id);
  const mine = (item: ActivityItem) => !!meId && item.actorId === meId;
  const comment = (item: ActivityItem): CommentProps => ({
    item, canEdit: canWrite && mine(item), canDelete: canWrite && (mine(item) || canModerate), onQuote,
    onSave: body => onEdit(item.id, body), onDelete: () => setDeleting(item),
  });
  return <VStack as="section" gap={3} aria-label="활동">
    <Text type="supporting" color="secondary" weight="medium">활동</Text>
    {items.length ? <VStack as="ol" className={styles.timeline} aria-label="활동 기록">
      {items.filter(item => !isReply(item)).map(item => (item.kind === 'comment'
        ? <TimelineItem key={item.id} kind="card">
          <article className={styles.card} aria-label={`${actorName(item)}의 댓글`}>
            <Comment {...comment(item)} />
            {repliesOf(item.id).map(reply => <Comment key={reply.id} {...comment(reply)} isReply />)}
            {canWrite ? <ReplyBox onSend={body => onComment(body, item.id)} /> : null}
          </article>
        </TimelineItem>
        : <EventLine key={item.id} item={item} />))}
    </VStack> : null}
    {canWrite ? <CommentComposer onSend={onComment} /> : null}
    {error ? <Text type="supporting" color="secondary" role="alert">{error}</Text> : null}
    <AlertDialog isOpen={!!deleting} onOpenChange={open => { if (!open && !isBusy) setDeleting(null); }}
      title="댓글을 지울까요?" description="지운 댓글은 활동에서 사라집니다." actionLabel="삭제" cancelLabel="취소"
      actionVariant="destructive" isActionLoading={isBusy} onAction={() => { if (deleting) remove(deleting); }} />
  </VStack>;
}

const actorName = (item: ActivityItem) => `${item.actorName ?? '알 수 없는 사람'}${item.agent?.name ? ` · ${item.agent.name}` : ''}`;

function ActorPictures({ item }: { item: ActivityItem }) {
 return <PersonAvatar name={item.actorName} size="xsm" shape="circle" />;
}

function EventLine({ item }: { item: ActivityItem }) {
  return <TimelineItem mark={<Icon icon={solarIcon((item.icon ?? 'edit') as Parameters<typeof solarIcon>[0])} size="sm" color="secondary" />}>
    <HStack gap={2} vAlign="start">
      <ActorPictures item={item} />
      <Text as="p" className={styles.eventText}>
        <Text className={styles.actor}>{actorName(item)}</Text>{` ${item.text ?? ''}`}
        <time className={styles.time} dateTime={item.at} title={new Date(item.at).toLocaleString('ko-KR')}>{` · ${moment(item.at)}`}</time>
      </Text>
    </HStack>
  </TimelineItem>;
}

type CommentProps = {
  item: ActivityItem; canEdit: boolean; canDelete: boolean; onQuote?: (quote: string) => void;
  onSave: (body: string) => Promise<unknown>; onDelete: () => void; isReply?: boolean;
};


function Comment({ item, canEdit, canDelete, onQuote, onSave, onDelete, isReply = false }: CommentProps) {
  const [isEditing, setEditing] = useState(false);
  const actions: MenuAction[] = [
    ...(canEdit ? [{ id: 'edit', label: '고치기', icon: 'edit' as const, onSelect: () => setEditing(true) }] : []),
    ...(canDelete ? [{ id: 'delete', label: '삭제', icon: 'delete' as const, onSelect: onDelete }] : []),
  ];
  const name = actorName(item);
  return <VStack className={styles.comment} data-agent={item.agent ? true : undefined} data-reply={isReply || undefined} aria-label={isReply ? `${name}의 답글` : undefined}>
    <header className={styles.cardHead}>
      <ActorPictures item={item} />
      <Text className={styles.actor}>{name}</Text>
      <time className={styles.time} dateTime={item.at} title={new Date(item.at).toLocaleString('ko-KR')}>
        {item.editedAt ? `${moment(item.at)} · 고침` : moment(item.at)}
      </time>
      {actions.length && !isEditing ? <HStack className={styles.cardMenu}><CommentMenu actions={actions} /></HStack> : null}
    </header>
    {item.quote ? <Quote text={item.quote} onQuote={onQuote} /> : null}
    {isEditing
      ? <VStack className={styles.cardEdit}>
        <CommentComposer initial={item.body ?? ''} label="댓글 고치기" onCancel={() => setEditing(false)}
          onSend={body => onSave(body).then(() => setEditing(false))} />
      </VStack>
      : <Text as="p" className={styles.cardBody}>{item.body}</Text>}
  </VStack>;
}


function ReplyBox({ onSend }: { onSend: (body: string) => Promise<unknown> }) {
  const [isOpen, setOpen] = useState(false);
  return <VStack className={styles.replyBox}>
    {isOpen
      ? <CommentComposer label="답글" placeholder="답글을 남겨 주세요" onCancel={() => setOpen(false)}
        onSend={body => onSend(body).then(() => setOpen(false))} />
      : <button type="button" className={styles.replyOpen} onClick={() => setOpen(true)}>답글 남기기…</button>}
  </VStack>;
}

function CommentMenu({ actions }: { actions: MenuAction[] }) {
  const [isOpen, setOpen] = useState(false);
  return <AdaptivePopover label="댓글 메뉴" alignment="end" onOpenChange={setOpen}
    trigger={<Button label="댓글 메뉴" tooltip="더 보기" variant="ghost" size="sm" isIconOnly icon={createElement(solarIcon('more', isOpen))} />}
    content={close => <ActionMenu onDone={close} actions={actions} />} />;
}


export function Quote({ text, onQuote }: { text: string; onQuote?: (quote: string) => void }) {
  return onQuote
    ? <button type="button" className={styles.quote} title="본문에서 보기" onClick={() => onQuote(text)}>{text}</button>
    : <blockquote className={styles.quote}>{text}</blockquote>;
}


export function TimelineItem({ mark, kind = 'line', children }: { mark?: ReactNode; kind?: 'line' | 'card'; children: ReactNode }) {
  return <HStack as="li" className={styles.item} data-kind={kind}>
    {kind === 'line' ? <HStack className={styles.mark} aria-hidden>{mark}</HStack> : null}
    <VStack className={styles.body}>{children}</VStack>
  </HStack>;
}


export function CommentComposer({ initial = '', label = '댓글', placeholder = '의견을 남겨 주세요', onSend, onCancel }: {
  initial?: string; label?: string; placeholder?: string;
  onSend: (body: string) => Promise<unknown>; onCancel?: () => void;
}) {
  const [text, setText] = useState(initial);
  const [isBusy, setBusy] = useState(false);
  const send = (value: string) => {
    const body = value.trim();
    if (!body || isBusy) return;
    setBusy(true);
    onSend(body.slice(0, 10000)).then(() => { if (!onCancel) setText(''); }, () => undefined).finally(() => setBusy(false));
  };
  return <ChatComposer className={styles.composer} density="compact" elevation="none" value={text} onChange={setText} onSubmit={send}
    placeholder={placeholder} isDisabled={isBusy} aria-label={label} input={<ChatComposerInput label={label} pasteAsToken={false} onKeyDown={event=>{if(event.key==='Escape'&&onCancel){event.preventDefault();onCancel()}}}/>}
    footerActions={onCancel ? <Button label="취소" variant="ghost" size="sm" onClick={onCancel} isDisabled={isBusy} /> : undefined} />;
}


export function Timeline({ label, children }: { label: string; children: ReactNode }) {
  return <VStack as="ol" className={styles.timeline} aria-label={label}>{children}</VStack>;
}
