import { render, waitFor } from '@testing-library/react';
import { expect, test } from 'vitest';
import { Diagram } from '@/shared/markdown/Diagram';

test('도표를 계산하는 동안 문서 전체 높이가 늘어나지 않는다', async () => {
  const host = document.createElement('div');
  host.style.height = '100vh';
  document.body.append(host);
  const baseline = document.documentElement.scrollHeight;
  let maxHeight = baseline;
  const sample = () => { maxHeight = Math.max(maxHeight, document.documentElement.scrollHeight); };
  const observer = new MutationObserver(sample);
  observer.observe(document.body, { childList: true, subtree: true });
  let frame = 0;
  const tick = () => { sample(); frame = requestAnimationFrame(tick); };
  frame = requestAnimationFrame(tick);
  const view = render(<div style={{ height: '100%', overflow: 'auto' }}>
    <Diagram data-diagram={'flowchart TD\n A[첫 단계] --> B[다음 단계]'} />
    <Diagram data-diagram={'flowchart LR\n C[요청] --> D[응답]'} />
  </div>, { container: host });
  try {
    await waitFor(() => expect(host.querySelectorAll('figure svg')).toHaveLength(2), { timeout: 20000 });
    sample();
    expect(maxHeight).toBe(baseline);
  } finally {
    observer.disconnect();
    cancelAnimationFrame(frame);
    view.unmount();
    host.remove();
  }
}, 30000);
