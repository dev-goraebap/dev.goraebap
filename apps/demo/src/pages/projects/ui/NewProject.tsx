import { useId, useState } from "react"
import {
  keyFrom, PROJECT_COLORS, PROJECT_ICONS, PROJECT_KEY, PROJECT_PEOPLE, ProjectMark, useCreateProject, type NewProject as Draft, type ProjectIconName,
} from "@/entities/project"
import { ComposeFields, ComposeSurface } from "@/shared/ui/compose"
import { Field, FieldDescription, FieldLabel } from "@/shared/ui/field"
import { HashtagIcon, ProjectsIcon, UserIcon } from "@/shared/ui/icon"
import { Input } from "@/shared/ui/input"
import { PersonAvatar } from "@/shared/ui/person-avatar"
import { OptionPill, PropertyPill } from "@/shared/ui/property-pill"
import { toast } from "@/shared/ui/toast"

/** 키 알약: 이름에서 제안한 키를 보이고, 직접 적으면 그 키를 쓴다(영문 대문자 · 숫자 2~10자). */
function KeyPill({ value, onChange }: { value: string; onChange: (key: string) => void }) {
  const id = useId()
  return (
    <PropertyPill label="키" icon={<HashtagIcon />} text={value ? `키 ${value}` : undefined} width="w-72">
      {() => (
        <Field className="p-1.5">
          <FieldLabel htmlFor={id}>키</FieldLabel>
          <Input id={id} value={value} placeholder="APP" autoFocus
            onChange={event => onChange(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))} />
          <FieldDescription>영문 대문자 · 숫자 2~10자입니다. 업무 번호가 {value || "APP"}-1처럼 붙습니다.</FieldDescription>
        </Field>
      )}
    </PropertyPill>
  )
}

/**
 * 새 프로젝트(호호코워크 CreateProjectDialog): 이름을 제목 자리에, 설명을 본문으로 쓰고, 키 · 표식 · 색 · 리드는 알약으로 고른다.
 * 자기 주소가 없는 짧은 양식이라 데스크톱은 대화상자뿐이고, 휴대폰은 전체 화면 페이지다. 만들면 목록 끝에 넣고 알린다.
 */
export function NewProject({ onClose }: { onClose: () => void }) {
  const create = useCreateProject()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [typedKey, setTypedKey] = useState<string>()
  const [icon, setIcon] = useState<ProjectIconName>("projects")
  const [color, setColor] = useState(PROJECT_COLORS[0].value)
  const [leadId, setLeadId] = useState(PROJECT_PEOPLE[0].id)
  const key = typedKey ?? keyFrom(name)

  const submit = () => {
    if (!PROJECT_KEY.test(key)) {
      toast.add({ type: "error", title: "키를 확인해 주세요", description: "영문 대문자 · 숫자 2~10자로 적어 주세요." })
      return
    }
    const draft: Draft = { key, name: name.trim(), description: description.trim() || undefined, icon, color,
      lead: PROJECT_PEOPLE.find(person => person.id === leadId)! }
    create.mutate(draft, {
      onSuccess: project => {
        toast.add({ type: "success", title: "프로젝트를 만들었습니다", description: `${project.name} · ${project.key}` })
        onClose()
      },
      onError: error => toast.add({ type: "error", title: "만들지 못했습니다", description: error.message }),
    })
  }

  return (
    <ComposeSurface surface="dialog" onClose={onClose} crumbs={[{ label: "프로젝트" }, { label: "새 프로젝트", icon: ProjectsIcon }]}
      chip={<ProjectMark icon={icon} color={color} size="sm" />}
      submit={{ label: "프로젝트 만들기", onSubmit: submit, isDisabled: !name.trim(), isPending: create.isPending }}
      pills={
        <>
          <KeyPill value={key} onChange={setTypedKey} />
          <OptionPill label="표식" icon={ProjectsIcon} value={icon} onChange={setIcon}
            options={PROJECT_ICONS.map(each => ({ value: each.value, label: each.label, icon: <ProjectMark icon={each.value} color={color} size="sm" /> }))} />
          <OptionPill label="색" icon={ProjectsIcon} value={color} onChange={setColor}
            options={PROJECT_COLORS.map(each => ({ value: each.value, label: each.label, icon: <ProjectMark icon={icon} color={each.value} size="sm" /> }))} />
          <OptionPill label="리드" icon={UserIcon} value={leadId} onChange={setLeadId}
            options={PROJECT_PEOPLE.map(person => ({ value: person.id, label: person.name, icon: <PersonAvatar id={person.id} name={person.name} className="size-4" /> }))} />
        </>
      }>
      <ComposeFields title={name} onTitle={next => setName(next.slice(0, 64))} titlePlaceholder="프로젝트 이름"
        body={description} onBody={setDescription} bodyPlaceholder="이 프로젝트가 하는 일과 목표를 적어 주세요." />
    </ComposeSurface>
  )
}
