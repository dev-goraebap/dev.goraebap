import type { ComponentProps } from "react";
import { AdminApp } from "./admin/app/AdminApp";
import { createAdminApi } from "./admin/mocks/admin-api";

/** 태그·사용자·권한 견본이 함께 쓰는 관리 앱(shadcn 키트). 견본마다 메모리 라우터와 모의 저장소를 새로 만든다. */
export function AdminSample(props: ComponentProps<typeof AdminApp>) {
  return <AdminApp key={`${props.initialPath}-${JSON.stringify(props.preset ?? {})}`} {...props} api={props.api ?? createAdminApi({ delay: 60 })} />;
}
