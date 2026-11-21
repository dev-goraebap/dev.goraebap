import { createFileRoute } from '@tanstack/react-router';
import { projectOptions } from '@/entities/project';
import { prepare } from '@/shared/lib/prepare';

/** /workspace/projects/{key} 아래 전부: 프로젝트(이름 · 권한)를 먼저 읽어 둔다. 메뉴와 페이지 머리가 그 이름을 쓴다. */
export const Route = createFileRoute('/_app/workspace/projects/$key')({
  loader: ({ context, params }) => prepare(context.queryClient, `project:${params.key}`, ({ prime }) => prime(projectOptions(params.key))),
});
