export interface DemoDesignPayload {
  theme: string;
  dark: boolean;
  radius: string;
  cornerShape: string;
  uiSize: string;
  fontSans?: string;
  fontHeading?: string;
}

export function applyDesignPayload(payload: Partial<DemoDesignPayload>) {
  const root = document.documentElement;
  if (payload.theme) root.setAttribute("data-ds-theme", payload.theme);
  if (typeof payload.dark === "boolean") root.classList.toggle("dark", payload.dark);
  if (payload.radius) root.style.setProperty("--radius", payload.radius);
  if (payload.cornerShape) root.style.setProperty("--ds-corner-shape", payload.cornerShape);
  if (payload.uiSize) root.style.setProperty("--ui-size", payload.uiSize);
  if (payload.fontSans) root.style.setProperty("--font-sans", payload.fontSans);
  if (payload.fontHeading) root.style.setProperty("--font-heading", payload.fontHeading);
}

export function readInitialDesignFromQuery(): Partial<DemoDesignPayload> {
  const params = new URLSearchParams(window.location.search);
  const dark = params.get("dark");
  return {
    theme: params.get("theme") ?? "app",
    dark: dark === "1" || dark === "true",
    radius: params.get("radius") ?? "0.5rem",
    cornerShape: params.get("cornerShape") ?? "round",
    uiSize: params.get("uiSize") ?? "100%",
  };
}

export function notifyReady() {
  if (window.parent !== window) {
    window.parent.postMessage({ type: "gb:demo-ready" }, "*");
  }
}

export function observeDemoHeight(element: HTMLElement | null) {
  if (!element || window.parent === window) return () => {};
  let last = 0;
  const send = () => {
    const height = Math.ceil(element.getBoundingClientRect().height);
    if (height > 0 && height !== last) {
      last = height;
      window.parent.postMessage({ type: "gb:demo-height", height }, "*");
    }
  };
  send();
  const observer = new ResizeObserver(send);
  observer.observe(element);
  return () => observer.disconnect();
}
