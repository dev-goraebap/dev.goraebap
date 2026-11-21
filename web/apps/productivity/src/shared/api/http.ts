export class ApiError extends Error {
  /**
   * `isBadAddress` marks a read refused because a value in its path does not read (an id that is no id, such as
   * /approvals/abc): the address names nothing, as a 404 would say.
   */
  constructor(public readonly status: number, message: string, public readonly code?: string, public readonly isBadAddress = false) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * A read the server answered with 404, or refused because a value in its path does not read: the address or the thing
 * it names is not there, so retrying will not help.
 */
export const isNotFound = (error: unknown): boolean => error instanceof ApiError && (error.status === 404 || error.isBadAddress);

/**
 * Whether a 400 to a read blames only values of its path: the fields the server names are none of the query's, so they
 * can only be the path's ({id} and the like). A query the screen builds is checked before it is sent, so a refused
 * path value is an address that names nothing.
 */
export function blamesPath(url: string, fields: readonly string[]): boolean {
  if (fields.length === 0) return false;
  const query = new URL(url, 'http://local').searchParams;
  return fields.every(field => !query.has(field));
}

export async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal, credentials: 'same-origin', headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw await failure(response, url);
  }
  return response.json() as Promise<T>;
}

/** Module business errors (for example ORGANIZATION_IN_USE) carry a safe, user-facing detail. */
const businessCode = /^(?!COMMON_|AUTH_)[A-Z]+_[A-Z_]+$/;
/** Account conflicts raised for administrators' employee changes; their detail names the row or the fix. */
const adminAuthCodes = new Set(['AUTH_EMAIL_DUPLICATED', 'AUTH_LAST_ADMIN']);
const pdfUnavailableCodes = new Set(['DOCUMENT_PDF_BUSY', 'DOCUMENT_PDF_FAILED']);

/** 서버가 형식 검증 실패에 싣는 일반 문장(CommonErrorCode.COMMON_INVALID_REQUEST의 기본 메시지). */
const INVALID_REQUEST_DETAIL = '요청이 올바르지 않습니다';

/** `readUrl` is the address of a read, whose refused path values make it a not-found. */
async function failure(response: Response, readUrl?: string): Promise<ApiError> {
  const { status } = response;
  if (status === 401 && typeof window !== 'undefined') window.dispatchEvent(new Event('session-expired'));
  const messages: Record<number, string> = {
    400: '입력값을 확인해 주세요.',
    401: '로그인이 필요합니다.',
    403: '접근 권한이 없거나 요청을 확인할 수 없습니다. 화면을 새로고침해 주세요.',
    404: '대상을 찾을 수 없습니다. 목록을 새로고침해 주세요.',
    409: '다른 항목과 충돌하거나 마지막 관리자를 해제하는 요청입니다.',
    429: '잠시 후 인증 코드를 다시 요청해 주세요.',
    503: '서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.',
  };
  const problem = await readProblem(response);
  // 인증(코드 확인 · 로그인)의 400은 코드가 틀렸거나 만료된 경우다.
  const fallback = status === 400 && problem?.code?.startsWith('AUTH_')
    ? '입력값을 확인해 주세요. 인증 코드가 틀렸거나 만료되었다면 다시 요청해 주세요.'
    : messages[status] ?? '요청을 처리하지 못했습니다. 다시 시도해 주세요.';
  if (problem?.code && problem.detail && ((status < 500 && (businessCode.test(problem.code) || adminAuthCodes.has(problem.code))) || (status === 503 && pdfUnavailableCodes.has(problem.code)))) return new ApiError(status, problem.detail, problem.code);
  const badAddress = status === 400 && readUrl !== undefined && blamesPath(readUrl, problem?.fields ?? []);
  // 서버의 화면 규칙 위반(COMMON_INVALID_REQUEST)은 사람이 읽을 설명을 싣는다("기간에 근무일이 없습니다"). 형식 검증 실패는 서버가
  // 일반 문장(INVALID_REQUEST_DETAIL)만 보내므로 그때만 위의 공통 문구로 바꾼다(2026-11-15).
  if (status === 400 && !badAddress && problem?.code === 'COMMON_INVALID_REQUEST' && problem.detail && problem.detail !== INVALID_REQUEST_DETAIL) {
    return new ApiError(status, problem.detail, problem.code);
  }
  return new ApiError(status, fallback, problem?.code, badAddress);
}

async function readProblem(response: Response): Promise<{ code?: string; detail?: string; fields: string[] } | undefined> {
  try {
    const body: unknown = await response.json();
    if (typeof body !== 'object' || body === null) return undefined;
    const { code, detail, errors } = body as Record<string, unknown>;
    // Only the names of the fields at fault are kept, never what was sent.
    const fields = Array.isArray(errors)
      ? errors.map(error => (typeof error === 'object' && error !== null ? (error as Record<string, unknown>).field : undefined))
        .filter((field): field is string => typeof field === 'string')
      : [];
    return { code: typeof code === 'string' ? code : undefined, detail: typeof detail === 'string' ? detail : undefined, fields };
  } catch {
    return undefined;
  }
}

type CsrfToken = { token: string; headerName: string };

let pendingCsrf: Promise<CsrfToken> | undefined;

/**
 * The CSRF token for the next command. Commands that start together share one request: without the CSRF cookie yet
 * (a new browser session) each request would set a cookie of its own, and the command holding the overwritten one
 * would be refused.
 */
function csrfToken(): Promise<CsrfToken> {
  pendingCsrf ??= getJson<CsrfToken>('/api/v1/auth/csrf').finally(() => { pendingCsrf = undefined; });
  return pendingCsrf;
}

async function send(url: string, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', body?: unknown, retried = false): Promise<Response> {
  const csrf = await csrfToken();
  const response = await fetch(url, {
    method, credentials: 'same-origin',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', [csrf.headerName]: csrf.token },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (response.ok) return response;
  const error = await failure(response);
  // A token whose cookie another page overwrote was refused before the command ran: a new token sends it once more.
  if (error.code === 'AUTH_CSRF_INVALID' && !retried) return send(url, method, body, true);
  throw error;
}

export async function sendCommand(url: string, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', body?: unknown): Promise<void> {
  await send(url, method, body);
}

/**
 * A create command answered with 201 and a Location header; returns the new resource's path after checking it is one
 * of this API's same-origin paths (shared guideline 01).
 */
export async function sendCreate(url: string, body?: unknown): Promise<string> {
  const response = await send(url, 'POST', body);
  const location = response.headers.get('Location');
  const target = location ? new URL(location, window.location.origin) : null;
  if (!target || target.origin !== window.location.origin || !target.pathname.startsWith('/api/v1/'))
    throw new Error('만든 항목의 주소를 확인하지 못했습니다. 목록을 새로고침해 주세요.');
  return target.pathname;
}

/** A command whose response body the caller needs, such as the created resource. */
export async function sendJson<T>(url: string, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', body?: unknown): Promise<T> {
  const response = await send(url, method, body);
  return (response.status === 204 ? undefined : await response.json()) as T;
}
