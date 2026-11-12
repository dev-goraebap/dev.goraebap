import { useId, type ComponentProps, type ReactNode } from 'react';
import logo from '@/shared/brand/logo.svg?raw';
import { Button } from '@/shared/ui/button';
import { Field, FieldError, FieldLabel } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { Spinner } from '@/shared/ui/spinner';

/** 제품 표시: 로고와 이름. 셸 없는 화면이라 사이드바 대신 카드 맨 위에 둔다. */
function Brand() {
  return <span className="inline-flex items-center gap-2.5 font-semibold" aria-label="dev-goraebap">
    <span aria-hidden className="block size-7 [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: logo }} />
    <span aria-hidden>dev-goraebap<span className="block text-xs font-medium text-muted-foreground">Webcraft</span></span>
  </span>;
}

/**
 * 인증 화면 바탕: 글자색을 옅게 섞은 빛 무리 세 개와 잔결. 색은 토큰에서 오므로 라이트 · 다크를 따로 정하지 않는다.
 * 데스크톱에서만 그린다(휴대폰은 카드 없이 화면 전체가 양식이다).
 */
function AuthBackground() {
  return <div aria-hidden className="absolute inset-0 -z-10 bg-sidebar max-md:hidden">
    <div className="absolute inset-0 bg-[radial-gradient(42%_26%_at_50%_30%,color-mix(in_srgb,var(--foreground)_22%,transparent),transparent),radial-gradient(36%_30%_at_8%_44%,color-mix(in_srgb,var(--foreground)_18%,transparent),transparent),radial-gradient(34%_34%_at_90%_56%,color-mix(in_srgb,var(--foreground)_24%,transparent),transparent)] blur-2xl" />
    <svg className="absolute inset-0 size-full opacity-60 mix-blend-overlay">
      <filter id="auth-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#auth-grain)" />
    </svg>
  </div>;
}

/**
 * 셸 없는 인증 화면의 틀: 바탕 위 가운데 카드에 로고, 제목(h1), 본문. 데스크톱은 바탕 위에 올린 면(카드)이고,
 * 휴대폰(64rem 미만)은 카드 테두리와 면 없이 화면 전체를 쓴다. 제목의 부모가 카드다(검사가 테두리를 본다).
 */
export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return <main aria-label={title} className="relative isolate flex min-h-full items-center justify-center overflow-auto bg-background p-4 max-md:items-start max-md:px-0 max-md:pt-10">
    <AuthBackground />
    <div className="flex w-full max-w-md flex-col gap-6 rounded-(--radius-surface) border bg-card p-10 text-card-foreground shadow-xs max-md:max-w-none max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:px-5 max-md:py-4 max-md:shadow-none">
      <Brand />
      <h1 className="text-2xl font-semibold">{title}</h1>
      {children}
    </div>
  </main>;
}

/**
 * 인증 양식의 칸 하나: 이름표, 입력, 칸 곁의 오류. 오류가 있으면 aria-invalid와 설명 연결을 단다(제출 검사가 첫 칸으로 초점을 옮긴다).
 * 칸 높이는 휴대폰 48px(키트 Input), 데스크톱은 인증 화면이라 44px로 조금 키운다.
 */
export function AuthField({ label, error, ...props }: { label: string; error?: string } & Omit<ComponentProps<'input'>, 'id'>) {
  const id = useId();
  return <Field data-invalid={!!error || undefined}>
    <FieldLabel htmlFor={id}>{label}</FieldLabel>
    <Input id={id} className="md:h-11" aria-invalid={!!error || undefined} aria-describedby={error ? `${id}-error` : undefined} {...props} />
    <FieldError id={`${id}-error`}>{error}</FieldError>
  </Field>;
}

/** 보내는 동안 글자 앞에 도는 표시. 다시 누르지 못하게 막지는 않고(양식이 보내는 중이면 무시한다) 진행만 알린다. */
export function AuthButton({ isPending, children, variant = 'default', ...props }: { isPending?: boolean; children: ReactNode } & ComponentProps<typeof Button>) {
  return <Button variant={variant} className="h-11 w-full rounded-full md:h-11" aria-busy={isPending || undefined} {...props}>
    {isPending && <Spinner data-icon="inline-start" />}
    {children}
  </Button>;
}

/** 인증 화면의 글자 링크: 밑줄 없이 강조색, 가리키면 밑줄. 휴대폰에서도 누를 자리가 44px이다. */
export const textLink = 'inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:underline md:min-h-0';

/** 서버가 거절했을 때 양식 위 · 아래의 한 줄. 어느 칸이 틀렸는지 말하지 않는다. */
export function AuthError({ children }: { children: ReactNode }) {
  return <p role="alert" className="text-sm text-destructive">{children}</p>;
}
