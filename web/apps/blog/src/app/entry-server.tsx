import { renderToString } from "react-dom/server";
import { RouterProvider, createMemoryHistory } from "@tanstack/react-router";
import { diataxisAllDocs, diataxisDocHref } from "@/entities/diataxis-doc";
import { CONTENT_DOCS, blogPosts, stacksOf, docHref } from "@/entities/content-doc";
import { createAppRouter } from "./router/router";

// 빌드 때 정적 HTML로 만들 주소: content 문서마다 고를 수 있는 스택 하나씩
export const routes = () => [
  ...CONTENT_DOCS.flatMap((doc) => {
    const stacks = stacksOf(doc.menu);
    return stacks.length ? stacks.map((stack) => docHref(doc, stack)) : [docHref(doc, "")];
  }),
  "/design-system/glossary",
  ...diataxisAllDocs("frontend").map((doc) => diataxisDocHref(doc)),
  "/frontend/glossary",
  ...diataxisAllDocs("backend").map((doc) => diataxisDocHref(doc)),
  "/backend/glossary",
  ...(blogPosts().length ? ["/blog"] : []),
];

export async function render(url: string) {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [url] }));
  await router.load();
  return renderToString(<RouterProvider router={router} />);
}
