import type { Meta, SampleOf } from "../catalog/types";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { PlusIcon } from "@/shared/ui/icon";
import { Input } from "@/shared/ui/input";
import { PersonAvatar as Avatar } from "@/shared/ui/person-avatar";
import { Comparison } from "../catalog/Comparison";

const meta = { title: "Primitives (기본 부품)/사용 기준", id: "primitives-overview", layout: "centered", kit: "shadcn" } satisfies Meta;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Roles: Sample = {
  name: "역할별 부품",
  render: () => <Comparison items={[
    { label: "실행", content: <Button>저장</Button> },
    { label: "만들기", content: <Button variant="create"><PlusIcon data-icon="inline-start" />자료 추가</Button> },
    { label: "분류", content: <Badge variant="label">디자인 참고</Badge> },
    { label: "상태", content: <span className="flex items-center gap-1.5 text-xs"><span aria-hidden className="size-2 rounded-full bg-mark-done" />완료</span> },
    { label: "개수", content: <Badge variant="secondary" className="tabular-nums">12</Badge> },
    { label: "사람", content: <Avatar name="서윤" className="size-6" /> },
    { label: "값", content: <Input aria-label="이름" placeholder="이름" className="w-36" /> },
  ]} />,
};
