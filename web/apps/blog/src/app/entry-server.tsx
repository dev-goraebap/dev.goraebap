import { renderToString } from "react-dom/server";
import { RouterProvider, createMemoryHistory } from "@tanstack/react-router";
import { backendAllDocs, backendDocHref } from "@/entities/backend-doc";
import { CONTENT_DOCS, blogPosts, stacksOf, docHref } from "@/entities/content-doc";
import { createAppRouter } from "./router/router";

// 빌드 때 정적 HTML로 만들 주소: content 문서마다 고를 수 있는 스택 하나씩
export const routes = () => [
  ...CONTENT_DOCS.flatMap((doc) => {
    const stacks = stacksOf(doc.menu);
    return stacks.length ? stacks.map((stack) => docHref(doc, stack)) : [docHref(doc, "")];
  }),
  ...backendAllDocs().map((doc) => backendDocHref(doc)),
  "/backend/glossary",
  ...(blogPosts().length ? ["/blog"] : []),
];

export async function render(url: string) {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [url] }));
  await router.load();
  return renderToString(<RouterProvider router={router} />);
}
