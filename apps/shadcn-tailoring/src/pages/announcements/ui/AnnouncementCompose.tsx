import { useState } from "react"
import {
  CATEGORIES, announcementHref, useCreateAnnouncement, useUpdateAnnouncement, type Announcement, type AnnouncementDraft,
} from "@/entities/announcement"
import { paths } from "@/shared/config"
import { Checkbox } from "@/shared/ui/checkbox"
import { ComposeFields, ComposeSurface, PlaceChip } from "@/shared/ui/compose"
import { Field, FieldGroup, FieldLabel } from "@/shared/ui/field"
import { MegaphoneIcon, PinIcon, TagIcon } from "@/shared/ui/icon"
import { type Crumb } from "@/shared/ui/page"
import { OptionPill, PropertyPill } from "@/shared/ui/property-pill"
import { toast } from "@/shared/ui/toast"

const TITLE_MAX = 200

const draftOf = (notice?: Announcement): AnnouncementDraft => ({
  title: notice?.title ?? "", body: notice?.body ?? "", category: notice?.category ?? "general",
  isPinned: notice?.isPinned ?? false, isImportant: notice?.isImportant ?? false,
})

const featureText = (draft: AnnouncementDraft) => [draft.isPinned && "고정", draft.isImportant && "중요"].filter(Boolean).join(" · ") || undefined

/** 고정 · 중요: 목록 맨 위에 고정하고, 중요 공지로 알린다. */
function FeatureFields({ draft, onChange }: { draft: AnnouncementDraft; onChange: (patch: Partial<AnnouncementDraft>) => void }) {
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
 * 새 공지 · 공지 수정(호호코워크 AnnouncementCompose): 제목과 본문(Markdown)을 쓰고 분류와 고정 · 중요를 알약으로 고른다.
 * 게시하면 바로 모든 구성원에게 보인다(임시 저장 없음). 데스크톱은 목록 · 공지 위 대화상자, 휴대폰은 자기 페이지(ComposeSurface).
 */
export function AnnouncementCompose({ notice, surface, onClose, onSaved }: {
  /** 고칠 공지. 없으면 새 공지다. */
  notice?: Announcement
  surface: "dialog" | "page"
  onClose: () => void
  onSaved: (id: string) => void
}) {
  const create = useCreateAnnouncement()
  const update = useUpdateAnnouncement()
  const [draft, setDraft] = useState(() => draftOf(notice))
  const set = (patch: Partial<AnnouncementDraft>) => setDraft(current => ({ ...current, ...patch }))
  const clean = { ...draft, title: draft.title.trim(), body: draft.body.trim() }
  const submit = () => {
    if (notice) {
      update.mutate({ id: notice.id, draft: clean }, {
        onSuccess: () => {
          toast.add({ type: "success", title: "공지를 고쳤습니다" })
          onSaved(notice.id)
        },
      })
    } else {
      create.mutate(clean, {
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
      submit={{
        label: notice ? "저장" : "게시", onSubmit: submit,
        isDisabled: !clean.title || !clean.body, isPending: create.isPending || update.isPending,
      }}
      pills={<>
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
