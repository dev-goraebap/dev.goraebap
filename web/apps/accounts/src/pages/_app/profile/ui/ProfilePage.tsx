import { useState, type FormEvent } from "react";
import { Button } from "@goraebap/ui/components/button";
import { updateMyName, type AuthMe } from "@/entities/session";
import { PageHeader } from "@/shared/ui";

interface ProfilePageProps {
  user: AuthMe;
}

export function ProfilePage({ user }: ProfilePageProps) {
  const [name, setName] = useState(user.name ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSavedNotice(false);
    setSaving(true);
    try {
      await updateMyName(name.trim());
      setSavedNotice(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "이름을 변경하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="프로필"
        description="변경한 이름은 모든 연결된 서비스에 즉시 반영됩니다."
      />

      <section className="border-border bg-card space-y-5 rounded-xl border p-6">
        {error ? (
          <p
            role="alert"
            className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-xs"
          >
            {error}
          </p>
        ) : null}

        {savedNotice ? (
          <p className="bg-secondary text-secondary-foreground rounded-md px-3 py-2 text-xs">
            이름을 저장했습니다.
          </p>
        ) : null}

        <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
          <div className="space-y-1.5">
            <span className="text-muted-foreground text-xs font-medium">이메일</span>
            <p className="font-mono text-sm">{user.email}</p>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium">표시 이름</span>
            <input
              type="text"
              required
              maxLength={64}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-input bg-background focus-visible:ring-ring flex h-9 w-full max-w-sm rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
            />
          </label>

          <Button type="submit" disabled={saving}>
            {saving ? "저장 중…" : "저장"}
          </Button>
        </form>
      </section>
    </div>
  );
}
