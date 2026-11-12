import { Button } from '@astryxdesign/core/Button';
import { Center } from '@astryxdesign/core/Center';
import { HStack } from '@astryxdesign/core/HStack';
import { ListItem } from '@astryxdesign/core/List';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Text } from '@astryxdesign/core/Text';
import { PageState } from '@/shared/ui/composites/state/PageState';
import { icon } from '@/shared/ui/foundations/icons/solar-icon';
import { Page } from '@/shared/ui/layouts/page/Page';
import { PageList } from '@/shared/ui/layouts/page/PageParts';
import { useQuery } from '@tanstack/react-query';
import { threadQueries, useThreadApi } from '../entities/thread';
import styles from './thread.module.css';

/** 대화방 목록. 휴대폰은 대화방이 전체 화면이라 여기서 고르고, 데스크톱도 같은 목록을 메뉴와 나란히 쓴다. */
export function RoomsPage() {
  const api = useThreadApi();
  const query = useQuery(threadQueries.rooms(api));
  const content = () => {
    if (query.isPending) return <Center height="100%"><Spinner label="대화방을 불러오는 중" /></Center>;
    if (query.isError) return <PageState kind="error" title="대화방을 불러오지 못했습니다" description="잠시 후 다시 시도해 주세요."
      action={<Button label="다시 시도" variant="secondary" onClick={() => void query.refetch()} />} />;
    if (query.data.length === 0) return <PageState kind="empty" title="대화방이 없습니다" description="초대받으면 여기에 모입니다." />;
    return <PageList hasDividers aria-label="대화방">
      {query.data.map(room => <ListItem key={room.id} href={`/rooms/${room.id}`}
        label={<Text weight="medium" maxLines={1}>{room.name}</Text>}
        description={<Text color="secondary" maxLines={1}>{room.members.join(', ')}</Text>}
        startContent={<span className={styles.roomMark}>{icon('comment')}</span>}
        endContent={<HStack><Text type="supporting" color="secondary" hasTabularNumbers textWrap="nowrap">{room.members.length}명</Text></HStack>} />)}
    </PageList>;
  };
  return <Page crumbs={[{ label: '대화' }]}>{content()}</Page>;
}
