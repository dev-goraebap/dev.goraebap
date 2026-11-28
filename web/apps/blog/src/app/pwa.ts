import { initPwaInstallCapture } from "@/shared/lib/pwa-install";

/** 프로덕션에서 서비스 워커를 등록하고, 개발 환경에서는 이전 캐시 워커를 정리한다. */
export function registerPwa() {
  if (typeof window === "undefined") return;
  initPwaInstallCapture();

  if (!("serviceWorker" in navigator)) return;

  if (import.meta.env.DEV) {
    void navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => Promise.all(registrations.map((reg) => reg.unregister())))
      .catch(() => {});
    return;
  }

  const register = () => {
    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // 프라이빗 브라우징이나 정책으로 서비스 워커가 차단된 환경에서는 조용히 넘어간다.
    });
  };

  if (document.readyState === "complete") {
    register();
  } else {
    window.addEventListener("load", register, { once: true });
  }
}
