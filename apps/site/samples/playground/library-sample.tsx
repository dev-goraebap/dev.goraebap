import type { ComponentProps } from "react";
import { LibraryApp } from "./library/app/LibraryApp";
import { createResourceApi } from "./library/mocks/resource-api";

/** Playground 템플릿이 함께 쓰는 서가 앱(shadcn 키트). 견본마다 메모리 라우터와 모의 저장소를 새로 만든다. */
export function LibrarySample(props: ComponentProps<typeof LibraryApp>) {
  return <LibraryApp key={`${props.initialPath}-${props.initialLayout}`} {...props} api={props.api ?? createResourceApi({ delay: 60 })} />;
}
