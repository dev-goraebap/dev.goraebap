import { createFileRoute } from '@tanstack/react-router';
import { SearchPage } from './ui/SearchPage';

/** /search: 탐색. 데스크톱에서는 보던 화면 위 대화상자(PanelHost)로 열고, 휴대폰과 주소로 직접 온 경우 이 페이지로 연다. */
export const Route = createFileRoute('/_app/search/')({
  component: function SearchRoute() { return <SearchPage crumbs={[{ label: '검색', icon: 'search' }]} />; },
});
