import { Injectable, signal } from "@angular/core";

// 라이트·다크 모드. 첫 그림 전 적용은 index.html의 스크립트가 맡는다.
@Injectable({ providedIn: "root" })
export class Theme {
  readonly dark = signal(document.documentElement.classList.contains("dark"));

  toggle() {
    const next = !this.dark();
    this.dark.set(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // 저장할 수 없으면 이번 방문에서만 유지한다.
    }
  }
}
