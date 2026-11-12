import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { useEffect, useState } from 'react';
import { icon } from '../../foundations/icons/solar-icon';
import type { LinkPreview } from './types';
import { previewOf, useEditorHost } from './zoom';
import styles from './editor.module.css';

/**
 * 링크 카드: 웹 주소 하나를 제목·설명·대표 사진이 있는 카드로 보여 준다. 미리보기는 호스트의 함수가 읽고(서버가 읽어야 한다),
 * 읽지 못하면 주소만 있는 카드가 된다. 읽는 화면에서는 카드 전체가 새 탭으로 여는 링크이고, 고치는 화면에서는 누르면 블록이
 * 선택되며 열기·주소 고치기는 위에 뜨는 도구로 한다. 카드 전체를 덮는 링크와 사진은 키트 부품에 맞는 것이 없어 <a>·<img>로 둔다.
 */
export function LinkCard({ url, host, isEditable, onEdit }: { url: string; host: string; isEditable: boolean; onEdit: () => void }) {
  const { readPreview } = useEditorHost();
  const [preview, setPreview] = useState<LinkPreview | null>(null), [noPicture, setNoPicture] = useState(false);
  useEffect(() => {
    let live = true;
    setPreview(null); setNoPicture(false);
    if (!readPreview) { setPreview({ url, site: host }); return; }
    previewOf(readPreview, url).then(found => { if (live) setPreview(found); }).catch(() => { if (live) setPreview({ url, site: host }); });
    return () => { live = false; };
  }, [url, host, readPreview]);
  const title = preview?.title || host, site = preview?.site || host;
  return <VStack className={styles.linkCardBox}>
    {isEditable ? <HStack className={styles.mediaTools} gap={0.5} vAlign="center">
      <Button label="새 탭에서 열기" tooltip="새 탭에서 열기" variant="ghost" size="sm" isIconOnly icon={icon('external')} href={url} target="_blank" rel="noopener noreferrer" />
      <Button label="링크 카드 주소 고치기" tooltip="주소 고치기" variant="ghost" size="sm" isIconOnly icon={icon('edit')} onClick={onEdit} />
    </HStack> : null}
    <a className={styles.linkCard} href={url} target="_blank" rel="noopener noreferrer" data-loading={preview ? undefined : ''} draggable={false}
      onClick={event => { if (isEditable) event.preventDefault(); }}>
      <VStack className={styles.linkCardText} gap={1} vAlign="center">
        <Text weight="semibold" maxLines={1} className={styles.linkCardTitle}>{preview ? title : host}</Text>
        {preview?.description ? <Text type="supporting" color="secondary" maxLines={2} className={styles.linkCardDescription}>{preview.description}</Text> : null}
        <HStack className={styles.linkCardSite} gap={1.5} vAlign="center">
          {icon('globe')}<Text type="supporting" color="secondary" maxLines={1}>{site}</Text>
          {site !== host ? <Text type="supporting" color="secondary" maxLines={1} className={styles.linkCardHost}>{host}</Text> : null}
        </HStack>
      </VStack>
      {/* 사진 칸은 늘 둔다: 페이지가 대표 사진을 밝히지 않았거나 받지 못하면 같은 자리에 빈 칸 표시를 둬 카드 모양을 맞춘다. */}
      {preview?.image && !noPicture
        ? <VStack className={styles.linkCardPicture}><img src={preview.image} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" draggable={false} onError={() => setNoPicture(true)} /></VStack>
        : <VStack className={`${styles.linkCardPicture} ${styles.linkCardNoPicture}`} gap={1.5} hAlign="center" vAlign="center">
          {icon('image')}<Text type="supporting">{preview ? '대표 이미지가 없습니다' : '불러오는 중…'}</Text>
        </VStack>}
    </a>
  </VStack>;
}
