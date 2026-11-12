import { useState } from "react"
import {
  CATEGORIES, announcementHref, useCreateAnnouncement, useUpdateAnnouncement, type Announcement, type AnnouncementDraft,
} from "@/entities/announcement"
import { paths } from "@/shared/config"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import {
  ComposeFields, ComposeSurface, FileDropzone, FileList, FileMark, FileRow, PlaceChip, fileSizeText, mergeFiles,
} from "@/shared/ui/compose"
import { Field, FieldGroup, FieldLabel } from "@/shared/ui/field"
import { ImageIcon, MegaphoneIcon, PaperclipIcon, PinIcon, TagIcon } from "@/shared/ui/icon"
import { type Crumb } from "@/shared/ui/page"
import { OptionPill, PropertyPill } from "@/shared/ui/property-pill"
import { toast } from "@/shared/ui/toast"
import { carryDraft, useCarriedDraft } from "@/shared/lib/panel"

const TITLE_MAX = 200

/** 양식의 값. 새로 고른 파일은 File 그대로 들고 있다가 게시할 때 붙이고, 이미 붙은 첨부는 뺄 것(removed)만 적어 둔다. */
type Draft = AnnouncementDraft & { files: File[]; removed: string[] }

const draftOf = (notice?: Announcement): Draft => ({
  title: notice?.title ?? "", body: notice?.body ?? "", category: notice?.category ?? "general",
  isPinned: notice?.isPinned ?? false, isImportant: notice?.isImportant ?? false, files: [], removed: [],
})

const featureText = (draft: Draft) => [draft.isPinned && "고정", draft.isImportant && "중요"].filter(Boolean).join(" · ") || undefined

/** 고정 · 중요: 목록 맨 위에 고정하고, 중요 공지로 알린다. */
function FeatureFields({ draft, onChange }: { draft: Draft; onChange: (patch: Partial<Draft>) => void }) {
  return (
    <FieldGroup className="gap-3 p-1.5">
      <Field orientation="horizontal">
        <Checkbox id="notice-pinned" checked={draft.isPinned} onCheckedChange={isPinned => onChange({ isPinned })} />
        <FieldLabel htmlFor="notice-pinned">목록 맨 위에 고정</FieldLabel>
      </Field>
      <Field orientation="horizontal">
        <Checkbox id="notice-important" checked={draft.isImportant} onCheckedChange={isImportant => onChange({ isImportant })} />
        <FieldLabel htmlFor="notice-important">중요 공지로 알리기</FieldLabel>
      </Field>
    </FieldGroup>
  )
}

/**
 * 파일 알약(호호코워크 AnnouncementCompose의 파일): 고르는 자리와 목록. 새로 고른 파일은 빼고, 이미 붙은 첨부는 빼기 ·
 * 되돌리기로 저장할 때 뺄지만 정한다. 형식과 크기는 가리지 않는다(호호코워크 공지도 받는 파일을 가리지 않는다).
 */
function FilesPill({ draft, kept, isDisabled, onChange }: {
  draft: Draft; kept: Announcement["attachments"]; isDisabled: boolean; onChange: (patch: Partial<Draft>) => void
}) {
  const count = draft.files.length + kept.filter(file => !draft.removed.includes(file.id)).length
  const toggle = (id: string) => onChange({ removed: draft.removed.includes(id) ? draft.removed.filter(each => each !== id) : [...draft.removed, id] })
  return (
    <PropertyPill label="파일" icon={<PaperclipIcon />} text={count > 0 ? `파일 ${count}` : undefined} width="w-88">
      {() => (
        <div className="flex flex-col gap-2 p-1">
          <FileDropzone label="파일 추가" isMultiple isDisabled={isDisabled} onPick={added => onChange({ files: mergeFiles(draft.files, added) })} />
          <FileList label="파일" files={draft.files} isDisabled={isDisabled} onRemove={file => onChange({ files: draft.files.filter(each => each !== file) })}>
            {kept.length > 0 && kept.map(file => {
              const isRemoved = draft.removed.includes(file.id)
              return (
                <FileRow key={file.id} name={file.name} media={<FileMark icon={file.isImage ? ImageIcon : undefined} />}
                  description={isRemoved ? "저장하면 빠집니다" : fileSizeText(file.size)}
                  action={<Button variant="ghost" size="sm" disabled={isDisabled} onClick={() => toggle(file.id)} className="max-md:h-11">{isRemoved ? "되돌리기" : "빼기"}</Button>} />
              )
            })}
          </FileList>
        </div>
      )}
    </PropertyPill>
  )
}

/**
 * 새 공지(/announcements/new) · 공지 수정(/announcements/{id}/edit)(호호코워크 AnnouncementCompose): 제목과 본문(Markdown)을 쓰고
 * 파일 · 분류 · 고정 · 중요를 알약으로 고른다. 파일은 올릴 서버가 없어 이 브라우저 안에만 두고, 게시하면 공지의 첨부가 된다. 게시하면 바로 모든 구성원에게 보인다(임시 저장 없음).
 * 데스크톱에서 목록 · 공지의 버튼으로 열면 그 위 대화상자, 링크 · 새로고침 · 크게 보기와 휴대폰은 자기 페이지(ComposeSurface).
 * 크게 보기는 고른 파일까지 쓰던 내용을 페이지로 넘긴다.
 */
export function AnnouncementCompose({ notice, surface, onClose, onExpand, onSaved }: {
  /** 고칠 공지. 없으면 새 공지다. */
  notice?: Announcement
  surface: "dialog" | "page"
  onClose: () => void
  /** 크게 보기: 같은 양식을 자기 페이지로. 대화상자에만 있다. */
  onExpand?: () => void
  onSaved: (id: string) => void
}) {
  const create = useCreateAnnouncement()
  const update = useUpdateAnnouncement()
  const carryKey = `announcement:${notice?.id ?? "new"}`
  const carried = useCarriedDraft<Draft>(carryKey)
  const [draft, setDraft] = useState(() => carried ?? draftOf(notice))
  const set = (patch: Partial<Draft>) => setDraft(current => ({ ...current, ...patch }))
  const { files, removed, ...values } = draft
  const clean: AnnouncementDraft = { ...values, title: draft.title.trim(), body: draft.body.trim() }
  const isPending = create.isPending || update.isPending
  const submit = () => {
    if (notice) {
      update.mutate({ id: notice.id, draft: clean, add: files, remove: removed }, {
        onSuccess: () => {
          toast.add({ type: "success", title: "공지를 고쳤습니다" })
          onSaved(notice.id)
        },
      })
    } else {
      create.mutate({ ...clean, files }, {
        onSuccess: item => {
          toast.add({ type: "success", title: "공지를 게시했습니다", description: item.title })
          onSaved(item.id)
        },
      })
    }
  }
  const crumbs: Crumb[] = notice
    ? [{ label: "공지사항", href: paths.announcements }, { label: notice.title, href: announcementHref(notice.id) }, { label: "공지 수정" }]
    : [{ label: "공지사항", href: paths.announcements }, { label: "새 공지" }]
  return (
    <ComposeSurface surface={surface} crumbs={crumbs} chip={<PlaceChip icon={<MegaphoneIcon />} label="모든 구성원" />} onClose={onClose}
      onExpand={onExpand && !isPending ? () => { carryDraft(carryKey, draft); onExpand() } : undefined}
      submit={{ label: notice ? "저장" : "게시", onSubmit: submit, isDisabled: !clean.title || !clean.body, isPending }}
      pills={<>
        <FilesPill draft={draft} kept={notice?.attachments ?? []} isDisabled={isPending} onChange={set} />
        <OptionPill label="분류" icon={TagIcon} value={draft.category} onChange={category => set({ category })} options={CATEGORIES.map(category => ({ ...category, icon: <TagIcon /> }))} />
        <PropertyPill label="고정 · 중요" icon={<PinIcon />} text={featureText(draft)} width="w-64">
          {() => <FeatureFields draft={draft} onChange={set} />}
        </PropertyPill>
      </>}>
      <ComposeFields title={draft.title} onTitle={title => set({ title: title.slice(0, TITLE_MAX) })} titlePlaceholder="공지 제목"
        body={draft.body} onBody={body => set({ body })} bodyPlaceholder="구성원이 알아야 할 내용을 적어 주세요" />
      <p className="text-xs text-muted-foreground">
        {notice ? "저장하면 고친 내용이 바로 모든 구성원에게 보입니다. 알림은 다시 보내지 않습니다." : "게시하면 모든 구성원에게 보이고 알림이 갑니다."}
      </p>
    </ComposeSurface>
  )
}
