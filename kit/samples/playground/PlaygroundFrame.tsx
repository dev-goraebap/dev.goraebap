import { useRef, type ComponentProps } from 'react';
import { AppFrame } from '@kit/layouts/app/AppFrame';
import { WorkflowBrand } from '@kit/foundations/brand/WorkflowBrand';
export function PlaygroundFrame(props: ComponentProps<typeof AppFrame>) {
  const scope = useRef(props.pathname.split('/')[1]);
  const allowed = (path: string) => {
    const base = path.split('/')[1]?.split('?')[0];
    return base === scope.current || ['inbox', 'archive'].includes(scope.current) && ['inbox', 'archive'].includes(base) || ['requests', 'inbox'].includes(scope.current) && ['requests', 'inbox'].includes(base);
  };
  const sections = props.space.sections.map(section => ({
    ...section,
    entries: section.entries.map(entry => ({
      ...entry,
      isDisabled: !allowed(entry.path),
      children: entry.children?.map(child => ({
        ...child,
        isDisabled: !allowed(child.path)
      }))
    }))
  }));
  const mock = [{
    path: '/__projects',
    label: '프로젝트',
    icon: 'folder' as const,
    isDisabled: true
  }, {
    path: '/__documents',
    label: '문서',
    icon: 'document' as const,
    isDisabled: true
  }, {
    path: '/__team',
    label: '팀',
    icon: 'user' as const,
    isDisabled: true
  }];
  return <AppFrame {...props} sidebarWidth={224} space={{
    ...props.space,
    sections: [...sections, {
      title: '작업 공간',
      entries: mock
    }]
  }} brand={isFolded => <WorkflowBrand isFolded={isFolded} />} footer={undefined} onNavigate={path => {
    if (allowed(path) && !path.startsWith('/__')) props.onNavigate?.(path);
  }} />;
}
