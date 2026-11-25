import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { firstValueFrom } from "rxjs";

interface CsrfToken {
  token: string;
  headerName: string;
}

// 서버의 application/problem+json 오류. 화면에는 detail(없으면 title)을 그대로 보인다.
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function toApiError(error: unknown, fallback: string): ApiError {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as { detail?: string; title?: string } | null;
    const message =
      body?.detail ?? body?.title ?? (error.status === 0 ? "서버에 연결할 수 없습니다." : fallback);
    return new ApiError(error.status, message);
  }
  return new ApiError(0, fallback);
}

@Injectable({ providedIn: "root" })
export class Api {
  private readonly http = inject(HttpClient);

  async get<T>(path: string, fallback = "정보를 불러오지 못했습니다."): Promise<T> {
    try {
      return await firstValueFrom(this.http.get<T>(path, { withCredentials: true }));
    } catch (error) {
      throw toApiError(error, fallback);
    }
  }

  // 상태를 바꾸는 요청은 서버가 내준 CSRF 토큰을 머리에 실어 보낸다.
  async send<T = void>(
    method: "POST" | "PUT" | "DELETE",
    path: string,
    body?: unknown,
    fallback = "요청을 처리하지 못했습니다.",
  ): Promise<T> {
    try {
      const csrf = await firstValueFrom(
        this.http.get<CsrfToken>("/api/v1/auth/csrf", { withCredentials: true }),
      );
      return await firstValueFrom(
        this.http.request<T>(method, path, {
          body,
          withCredentials: true,
          headers: { [csrf.headerName]: csrf.token },
        }),
      );
    } catch (error) {
      throw toApiError(error, fallback);
    }
  }
}
