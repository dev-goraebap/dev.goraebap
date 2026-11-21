export interface AuthMe {
  id: string;
  email: string;
  name: string;
  roles: string[];
  onboarded: boolean;
  expiresAt: string;
}

interface CsrfResponse {
  token: string;
  headerName: string;
}

interface ProblemDetail {
  title?: string;
  detail?: string;
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as ProblemDetail;
    return body.detail ?? body.title ?? fallback;
  } catch {
    return fallback;
  }
}

async function fetchCsrf(): Promise<CsrfResponse> {
  const response = await fetch("/api/v1/auth/csrf", { credentials: "include" });
  if (!response.ok) {
    throw new Error("인증 서버에 연결할 수 없습니다.");
  }
  return (await response.json()) as CsrfResponse;
}

async function postJson(path: string, body?: unknown): Promise<void> {
  const csrf = await fetchCsrf();
  const headers: Record<string, string> = {
    [csrf.headerName]: csrf.token,
  };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "요청을 처리하지 못했습니다."));
  }
}

export async function getCurrentUser(): Promise<AuthMe | null> {
  const response = await fetch("/api/v1/auth/me", { credentials: "include" });
  if (response.status === 401 || response.status === 403) {
    return null;
  }
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "계정 상태를 확인하지 못했습니다."));
  }
  return (await response.json()) as AuthMe;
}

export async function requestOtpCode(email: string): Promise<void> {
  await postJson("/api/v1/auth/otp/request", { email });
}

export async function verifyOtpCode(email: string, code: string): Promise<void> {
  await postJson("/api/v1/auth/otp/verify", { email, code });
}

export async function logoutCurrentSession(): Promise<void> {
  await postJson("/api/v1/auth/logout");
}

export async function logoutAllSessions(): Promise<void> {
  await postJson("/api/v1/auth/logout-all");
}
