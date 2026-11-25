import { HttpErrorResponse, HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { Api, ApiError } from "@/shared/api/http";
import { ServerState, queryOptions } from "@/shared/lib/server-state";

export interface AuthMe {
  id: string;
  email: string;
  name: string;
  roles: string[];
  onboarded: boolean;
  expiresAt: string;
}

export const SESSION_KEY = ["session"] as const;

// 로그인한 사람과 세션. 가드·리졸버·화면이 이 조회 옵션 하나를 함께 쓴다.
@Injectable({ providedIn: "root" })
export class SessionApi {
  private readonly api = inject(Api);
  private readonly http = inject(HttpClient);
  private readonly state = inject(ServerState);

  readonly me = queryOptions<AuthMe | null>({
    key: [...SESSION_KEY, "me"],
    staleTime: 60_000,
    fetch: async () => {
      try {
        return await firstValueFrom(
          this.http.get<AuthMe>("/api/v1/auth/me", { withCredentials: true }),
        );
      } catch (error) {
        // 로그인하지 않은 상태는 오류가 아니라 빈 값이다.
        if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
          return null;
        }
        throw error instanceof HttpErrorResponse
          ? new ApiError(error.status, "계정 상태를 확인하지 못했습니다.")
          : error;
      }
    },
  });

  async setupNeeded(): Promise<boolean> {
    try {
      return (await this.api.get<{ needed: boolean }>("/api/v1/setup")).needed;
    } catch {
      // 서버가 아직 뜨는 중이면 보통 로그인 단계로 둔다.
      return false;
    }
  }

  createFirstAdmin(name: string, email: string) {
    return this.api.send(
      "POST",
      "/api/v1/setup",
      { name, email },
      "초기 계정을 만들지 못했습니다.",
    );
  }

  requestCode(email: string) {
    return this.api.send(
      "POST",
      "/api/v1/auth/otp/request",
      { email },
      "인증 코드를 보내지 못했습니다.",
    );
  }

  // 로그인하면 이전 계정의 캐시를 비우고 새 세션을 읽는다.
  async verifyCode(email: string, code: string): Promise<AuthMe | null> {
    await this.api.send(
      "POST",
      "/api/v1/auth/otp/verify",
      { email, code },
      "인증 코드를 확인하지 못했습니다.",
    );
    this.state.clear();
    return this.state.ensure(this.me);
  }

  async updateName(name: string) {
    await this.api.send("PUT", "/api/v1/me/name", { name }, "이름을 변경하지 못했습니다.");
    await this.state.invalidate(SESSION_KEY);
  }

  async completeOnboarding() {
    await this.api.send(
      "PUT",
      "/api/v1/auth/onboarding",
      undefined,
      "초기 설정을 저장하지 못했습니다.",
    );
    await this.state.invalidate(SESSION_KEY);
  }

  async logout(all = false) {
    await this.api.send(
      "POST",
      all ? "/api/v1/auth/logout-all" : "/api/v1/auth/logout",
      undefined,
      "로그아웃하지 못했습니다.",
    );
    this.state.clear();
  }
}
