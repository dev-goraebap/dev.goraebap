import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider, useNavigate, useSearch } from '@tanstack/react-router';
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import logo from '@/shared/brand/logo.svg?raw';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Field, FieldError, FieldLabel } from '@/shared/ui/field';
import { CheckIcon } from '@/shared/ui/icon';
import { Input } from '@/shared/ui/input';
import { PersonAvatar } from '@/shared/ui/person-avatar';
import { Switch } from '@/shared/ui/switch';
import { celebrate } from './celebrate';
import { DRAWN_AVATARS, drawnAvatarSource } from './drawn-avatars';

type Theme = 'system' | 'light' | 'dark';
type Preferences = { theme: Theme; name: string; avatar: number; mentions: boolean; digest: boolean };

const steps = ['테마', '프로필', '알림', '완료'];
const titles = ['편한 화면으로 시작하세요', '동료에게 보여 줄 내 모습', '필요한 소식만 받아 보세요', '준비가 끝났습니다'];
/**
 * 테마 미리보기 그림의 바탕. 지금 테마와 무관하게 그 테마의 모습을 보여야 하므로 토큰 대신 고정 색이다.
 * 시스템은 반은 라이트, 반은 다크.
 */
const previews: { value: Theme; label: string; paper: string; ink: string }[] = [
  { value: 'light', label: '라이트', paper: '#f1f1f2', ink: '#a4a5a8' },
  { value: 'dark', label: '다크', paper: '#222326', ink: '#5e5f63' },
  { value: 'system', label: '시스템 설정', paper: 'linear-gradient(90deg,#f1f1f2 50%,#222326 50%)', ink: '#a4a5a8' },
];

const PreferencesContext = createContext<{ value: Preferences; set: (next: Preferences) => void }>(null!);

function Screen() {
  const { value, set } = useContext(PreferencesContext);
  return <Wizard value={value} onChange={set} />;
}

/**
 * 고른 테마를 바로 화면에 입힌다(html의 data-theme, 토큰이 따른다). 시스템은 기기 설정을 따른다.
 * 실제 앱은 화면 설정(appearance)에 저장하지만, 견본은 가이드와 같은 저장소를 쓰므로 저장하지 않고 견본을 닫으면 되돌린다.
 */
function useThemePreview(theme: Theme) {
  const original = useRef<string | undefined>(undefined);
  useLayoutEffect(() => {
    const root = document.documentElement;
    original.current ??= root.dataset.theme;
    const isDark = theme === 'dark' || (theme === 'system' && (original.current === 'dark'));
    root.dataset.theme = isDark ? 'dark' : 'light';
  }, [theme]);
  useEffect(() => () => { if (original.current) document.documentElement.dataset.theme = original.current; }, []);
}

export function OnboardingApp({ initialPath = '/setup' }: { initialPath?: string }) {
  const [value, set] = useState<Preferences>({ theme: 'system', name: '서윤', avatar: 0, mentions: true, digest: false });
  const [router] = useState(() => {
    const root = createRootRoute();
    const setup = createRoute({ getParentRoute: () => root, path: '/setup', component: Screen });
    const home = createRoute({ getParentRoute: () => root, path: '/', component: Screen });
    return createRouter({ routeTree: root.addChildren([setup, home]), history: createMemoryHistory({ initialEntries: [initialPath] }) });
  });
  return <PreferencesContext value={{ value, set }}><RouterProvider router={router} /></PreferencesContext>;
}

/** 단계 표시: 지난 단계는 체크, 지금 단계는 강조(aria-current). 누르지 않는 표시라 버튼이 아니다. */
function Stepper({ step }: { step: number }) {
  return (
    <ol aria-label="온보딩 단계" className="flex items-center gap-2">
      {steps.map((label, index) => (
        <li key={label} aria-current={index === step ? 'step' : undefined} className="flex min-w-0 flex-1 items-center gap-2">
          <span className={cn('grid size-6 shrink-0 place-items-center rounded-full border text-xs font-semibold tabular-nums',
            index < step && 'border-primary bg-primary text-primary-foreground', index === step && 'border-primary text-primary',
            index > step && 'text-muted-foreground')}>
            {index < step ? <CheckIcon className="size-3.5" /> : index + 1}
          </span>
          {/* 휴대폰은 폭이 좁아 지금 단계의 이름만 보이고, 나머지는 번호만(이름은 읽기용으로 남는다). */}
          <span className={cn('truncate text-sm', index === step ? 'shrink-0 font-semibold' : 'text-muted-foreground max-md:sr-only')}>{label}</span>
          {index < steps.length - 1 && <span aria-hidden className="h-px min-w-4 flex-1 bg-border" />}
        </li>
      ))}
    </ol>
  );
}

/**
 * 네 단계 온보딩: 테마 → 프로필 → 알림 → 완료. 지금 단계는 주소(?step=)가 가져 뒤로 가기가 앞 단계로 간다. 고른 값은 앱이
 * 들고 있어 이전으로 돌아가도 남는다. 단계가 바뀌면 제목으로 초점을 옮겨 화면 낭독기가 새 단계를 읽는다.
 */
function Wizard({ value, onChange }: { value: Preferences; onChange: (next: Preferences) => void }) {
  const search = useSearch({ strict: false }) as { step?: number };
  const step = Math.max(0, Math.min(3, Number(search.step) || 0));
  const navigate = useNavigate();
  const heading = useRef<HTMLHeadingElement>(null);
  const [error, setError] = useState<string>();
  const [isFinished, setFinished] = useState(false);
  useThemePreview(value.theme);
  useEffect(() => { heading.current?.focus(); }, [step]);
  const go = (next: number) => void navigate({ href: `/setup?step=${next}` });
  const next = () => {
    if (step === 1 && !value.name.trim()) { setError('이름을 입력해 주세요.'); return; }
    setError(undefined);
    go(step + 1);
  };
  const finish = () => {
    try { localStorage.setItem('workflow-onboarding', JSON.stringify(value)); } catch { /* 저장할 수 없어도 마친다. */ }
    setFinished(true);
    celebrate(heading.current);
  };
  const avatar = drawnAvatarSource(value.avatar);
  return (
    <main className="flex min-h-full justify-center bg-background px-6 py-8 md:items-center">
      <div className="flex w-full max-w-3xl flex-col gap-8 md:gap-12">
        <span className="inline-flex items-center gap-2.5 font-semibold" aria-label="dev-goraebap">
          <span aria-hidden className="block size-7 [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: logo }} />
          <span aria-hidden>dev-goraebap<span className="block text-xs font-medium text-muted-foreground">Webcraft</span></span>
        </span>
        <Stepper step={isFinished ? 4 : step} />
        <section className="flex min-h-96 flex-col gap-8 md:min-h-80">
          <h1 ref={heading} tabIndex={-1} className="text-2xl font-bold outline-none">{isFinished ? `환영합니다, ${value.name}님` : titles[step]}</h1>
          {isFinished ? <p>설정을 저장했습니다. 이제 작업 공간을 사용할 수 있습니다.</p>
            : step === 0 ? (
              <div className="grid gap-4 md:grid-cols-3">
                {previews.map(theme => (
                  <button key={theme.value} type="button" aria-pressed={value.theme === theme.value} onClick={() => onChange({ ...value, theme: theme.value })}
                    className="flex min-h-11 items-center gap-4 rounded-2xl border bg-card p-4 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:border-primary aria-pressed:ring-2 aria-pressed:ring-primary md:flex-col md:items-stretch">
                    {/* check-ui: allow-style 미리보기 그림은 고른 테마의 고정 색이다(지금 테마의 토큰이 아니다). */}
                    <span aria-hidden style={{ background: theme.paper, '--ink': theme.ink } as CSSProperties}
                      className="flex w-24 shrink-0 flex-col gap-2 rounded-lg p-3 md:min-h-24 md:w-auto md:p-4 [&>i]:h-2 [&>i]:w-[70%] [&>i]:rounded-sm [&>i]:bg-(--ink) [&>i:first-child]:w-[40%]">
                      <i /><i /><i />
                    </span>
                    <strong className="font-semibold">{theme.label}</strong>
                  </button>
                ))}
              </div>
            ) : step === 1 ? (
              <div className="flex flex-col gap-6">
                <div className="flex items-start gap-4">
                  <PersonAvatar name={value.name || '?'} picture={avatar} className="size-16" />
                  <Field data-invalid={!!error || undefined} className="flex-1">
                    <FieldLabel htmlFor="onboarding-name">이름</FieldLabel>
                    <Input id="onboarding-name" value={value.name} aria-invalid={!!error || undefined} aria-describedby={error ? 'onboarding-name-error' : undefined}
                      onChange={event => onChange({ ...value, name: event.target.value })} />
                    <FieldError id="onboarding-name-error">{error}</FieldError>
                  </Field>
                </div>
                <div role="group" aria-label="프로필 그림" className="grid grid-cols-6 gap-3 md:grid-cols-9">
                  {Array.from({ length: DRAWN_AVATARS }, (_, index) => (
                    <button key={index} type="button" aria-label={`프로필 그림 ${index + 1}`} aria-pressed={value.avatar === index}
                      onClick={() => onChange({ ...value, avatar: index })}
                      className="aspect-square min-h-11 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:ring-2 aria-pressed:ring-primary aria-pressed:ring-offset-2 aria-pressed:ring-offset-background">
                      <img alt="" src={drawnAvatarSource(index)} className="block size-full rounded-full" />
                    </button>
                  ))}
                </div>
              </div>
            ) : step === 2 ? (
              <div className="flex max-w-md flex-col gap-5">
                <Toggle label="멘션과 담당 알림" checked={value.mentions} onChange={mentions => onChange({ ...value, mentions })} />
                <Toggle label="하루 요약" checked={value.digest} onChange={digest => onChange({ ...value, digest })} />
                <p className="text-sm text-muted-foreground">알림 설정은 나중에 내 계정에서 바꿀 수 있습니다.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <PersonAvatar name={value.name} picture={avatar} className="size-16" />
                <p>{value.name}님만의 작업 공간을 시작해 보세요.</p>
              </div>
            )}
        </section>
        {!isFinished && (
          <footer className="flex items-center justify-between gap-2 border-t pt-6">
            <Button variant="ghost" className="max-md:h-11" disabled={step === 0} onClick={() => go(step - 1)}>이전</Button>
            <div className="flex items-center gap-2">
              {step === 2 && <Button variant="ghost" className="max-md:h-11" onClick={() => go(3)}>나중에 설정</Button>}
              <Button className="max-md:h-11 max-md:px-5" onClick={step === 3 ? finish : next}>{step === 3 ? '시작하기' : '다음'}</Button>
            </div>
          </footer>
        )}
      </div>
    </main>
  );
}

/** 이름과 스위치 한 줄. 줄 전체가 이름표라 어디를 눌러도 바뀌고, 휴대폰에서도 44px 높이다. */
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-4">
      <span>{label}</span>
      <Switch aria-label={label} checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
