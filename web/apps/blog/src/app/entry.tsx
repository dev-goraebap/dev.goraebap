import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router/router";
import "./theme/tailwind.css";

function dismissSplash() {
  const splash = document.getElementById("app-splash");
  if (!splash || splash.dataset.dismissed) return;
  splash.dataset.dismissed = "1";
  splash.classList.add("is-ready");

  let removed = false;
  const cleanup = () => {
    if (removed) return;
    removed = true;
    window.clearTimeout(fallbackTimer);
    splash.remove();
  };

  // 자식(.splash-inner)의 transitionend 버블링에 조기 제거되지 않도록 배경 자신의 종료만 기다린다.
  splash.addEventListener("transitionend", (event) => {
    if (event.target === splash) cleanup();
  });
  const fallbackTimer = window.setTimeout(cleanup, 650);
}

// 초기 마운트 직후(Shiki·Lenis·레이아웃 계산) 메인 스레드 스톨이 끝날 때까지 기다린 뒤 페이드를 시작한다.
function waitForQuietFrames(maxWaitMs = 360): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    const deadline = start + maxWaitMs;
    let last = start;
    let quietStreak = 0;

    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      if (now - start >= 60 && dt <= 24) {
        quietStreak += 1;
      } else {
        quietStreak = 0;
      }
      if (quietStreak >= 3 || now >= deadline) {
        resolve();
        return;
      }
      window.requestAnimationFrame(tick);
    };

    window.requestAnimationFrame(tick);
  });
}

async function boot() {
  const rootEl = document.getElementById("root")!;
  // 초기 라우트 청크와 웹 폰트(최대 250ms 대기)가 준비된 뒤 스플래시를 부드럽게 걷는다.
  const fontsReady = document.fonts?.ready
    ? Promise.race([
        document.fonts.ready,
        new Promise<void>((resolve) => window.setTimeout(resolve, 250)),
      ])
    : Promise.resolve();

  try {
    await Promise.all([router.load(), fontsReady]);
  } finally {
    createRoot(rootEl).render(
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>,
    );

    await waitForQuietFrames();
    dismissSplash();
  }
}

void boot();
