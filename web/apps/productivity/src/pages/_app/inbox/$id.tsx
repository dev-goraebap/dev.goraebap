import { createFileRoute } from '@tanstack/react-router';

/** /inbox/{id}: 그릴 것이 없다. 부모(목록 + 옆 칸)가 주소의 id로 상세를 연다. */
export const Route = createFileRoute('/_app/inbox/$id')({});
