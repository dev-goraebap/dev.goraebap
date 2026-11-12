import { useState } from "react"
import { paths } from "@/shared/config"
import { setAppearance, useAppearance, type Density, type Mode } from "@/shared/lib/appearance"
import { SettingsIcon } from "@/shared/ui/icon"
import { SegmentedControl } from "@/shared/ui/segmented-control"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { SettingsPage as SettingsLayout, SettingsRow, SettingsSection } from "@/shared/ui/settings"
import { Switch } from "@/shared/ui/switch"

type Option<T extends string = string> = { value: T; label: string }

const modes: Option<Mode>[] = [
  { value: "system", label: "시스템" },
  { value: "light", label: "라이트" },
  { value: "dark", label: "다크" },
]
const densities: Option<Density>[] = [
  { value: "spacious", label: "넉넉하게" },
  { value: "compact", label: "촘촘하게" },
]
const weekStarts: Option<"sun" | "mon">[] = [
  { value: "sun", label: "일" },
  { value: "mon", label: "월" },
]
const languages: Option[] = [{ value: "ko", label: "한국어" }]
const timezones: Option[] = [
  { value: "Asia/Seoul", label: "서울 (GMT+9)" },
  { value: "Asia/Tokyo", label: "도쿄 (GMT+9)" },
  { value: "Europe/London", label: "런던 (GMT+0)" },
  { value: "America/New_York", label: "뉴욕 (GMT-5)" },
]
const notifications = [
  { key: "email", label: "이메일 알림", description: "새 소식과 활동을 이메일로 받습니다." },
  { key: "push", label: "모바일 푸시", description: "휴대폰에 바로 알려 줍니다." },
  { key: "weekly", label: "주간 요약", description: "한 주의 활동을 월요일 아침에 모아 보냅니다." },
]

function OptionSelect({ label, options, value, onChange }: {
  label: string
  options: Option[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Select items={options} value={value} onValueChange={next => next && onChange(next)}>
      <SelectTrigger aria-label={label} className="min-w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

/** 화면 설정(/profile/display): 표시 · 알림 · 언어와 지역. */
export function SettingsPage() {
  const { mode, density } = useAppearance()
  const [enabled, setEnabled] = useState<Record<string, boolean>>({ email: true, push: true, weekly: false })
  const [language, setLanguage] = useState("ko")
  const [timezone, setTimezone] = useState("Asia/Seoul")
  const [weekStart, setWeekStart] = useState<"sun" | "mon">("mon")

  return (
    <SettingsLayout
      crumbs={[{ label: "내 계정", href: paths.profile }, { label: "화면 설정", icon: SettingsIcon }]}
      title="화면 설정"
      description="화면 표시와 알림, 언어를 이 브라우저에서 정합니다."
    >
      <SettingsSection title="표시" note="모드와 목록 높이는 이 브라우저에만 저장됩니다.">
        <SettingsRow wide label="모드" description="화면 색을 라이트와 다크 중에서 고릅니다.">
          <SegmentedControl label="모드" options={modes} value={mode} onChange={next => setAppearance({ mode: next })} />
        </SettingsRow>
        <SettingsRow wide label="목록 높이" description="목록과 표의 줄 높이입니다.">
          <SegmentedControl label="목록 높이" options={densities} value={density} onChange={next => setAppearance({ density: next })} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="알림">
        {notifications.map(item => (
          <SettingsRow key={item.key} label={item.label} description={item.description}>
            <Switch
              aria-label={item.label}
              checked={enabled[item.key]}
              onCheckedChange={checked => setEnabled(prev => ({ ...prev, [item.key]: checked }))}
            />
          </SettingsRow>
        ))}
      </SettingsSection>

      <SettingsSection title="언어와 지역">
        <SettingsRow wide label="언어">
          <OptionSelect label="언어" options={languages} value={language} onChange={setLanguage} />
        </SettingsRow>
        <SettingsRow wide label="시간대">
          <OptionSelect label="시간대" options={timezones} value={timezone} onChange={setTimezone} />
        </SettingsRow>
        <SettingsRow wide label="주 시작 요일">
          <SegmentedControl label="주 시작 요일" options={weekStarts} value={weekStart} onChange={setWeekStart} />
        </SettingsRow>
      </SettingsSection>
    </SettingsLayout>
  )
}
