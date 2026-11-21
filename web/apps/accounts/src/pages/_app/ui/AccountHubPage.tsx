import type { AuthMe } from "@/entities/session";
import { CONNECTED_SERVICES } from "@/shared/config";
import { PageHeader } from "@/shared/ui";

interface AccountHubPageProps {
  user: AuthMe;
}

export function AccountHubPage({ user }: AccountHubPageProps) {
  return (
    <div className="space-y-8">
      <PageHeader
        title="계정 허브"
        description="한 번 로그인하면 연결된 모든 *.goraebap.xyz 서비스를 이용할 수 있습니다."
      />

      <section className="border-border bg-card space-y-4 rounded-xl border p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs font-medium">현재 계정</p>
            <h2 className="text-lg font-semibold tracking-tight">{user.name || user.email}</h2>
            <p className="text-muted-foreground font-mono text-xs">{user.email}</p>
          </div>
          {user.roles.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {user.roles.map((role) => (
                <span
                  key={role}
                  className="bg-secondary text-secondary-foreground rounded-md px-2 py-0.5 font-mono text-[11px]"
                >
                  {role}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="border-border text-muted-foreground border-t pt-4 text-xs">
          세션 만료: {new Date(user.expiresAt).toLocaleString("ko-KR")}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">연결된 서비스</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {CONNECTED_SERVICES.map((service) => (
            <a
              key={service.name}
              href={service.href}
              className="border-border bg-card hover:bg-accent/50 flex flex-col justify-between gap-3 rounded-xl border p-5 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>{service.name}</span>
                  <span aria-hidden="true" className="text-muted-foreground text-xs">
                    ↗
                  </span>
                </div>
                <p className="text-muted-foreground text-xs">{service.description}</p>
              </div>
              <span className="text-muted-foreground font-mono text-[11px]">{service.devHint}</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
