import { redirect } from "@tanstack/react-router";
import { stacksOf } from "./content";
import { storedStack } from "./stack-choice";

// 스택 없는 문서 주소(/<메뉴>/<문서>)를 고른 적 있는 스택(없으면 첫 스택)의 주소로 보낸다. 라우트의 beforeLoad에서 던진다.
export function stackRedirect(menu: string, slug: string, hash?: string) {
  const stack = storedStack(menu.split("/")[0], stacksOf(menu));
  return redirect({ href: `/${menu}/${slug}/${stack}${hash ? `#${hash}` : ""}`, replace: true });
}
