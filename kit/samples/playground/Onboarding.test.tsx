import {test} from 'vitest';
import {expect,userEvent,waitFor,within} from '../catalog/testing';
import {runSample} from '../catalog/run-sample';
import type {SampleOf} from '../catalog/types';
import meta from './Onboarding.samples';
type Sample=SampleOf<typeof meta>;
const journey:Sample={name:'네 단계 설정과 이전 이동의 값 유지',args:{initialPath:'/setup'},play:async({canvasElement})=>{const p=within(canvasElement.ownerDocument.body);await userEvent.click(await p.findByRole('button',{name:'다크'}));await userEvent.click(p.getByRole('button',{name:'다음'}));const name=await p.findByRole('textbox',{name:'이름'});await userEvent.clear(name);await userEvent.type(name,'하은');await userEvent.click(p.getByRole('button',{name:/^프로필 그림 5$/}));await userEvent.click(p.getByRole('button',{name:'다음'}));await userEvent.click(await p.findByRole('switch',{name:'하루 요약'}));await userEvent.click(p.getByRole('button',{name:'이전'}));await expect(await p.findByRole('textbox',{name:'이름'})).toHaveValue('하은');await expect(p.getByRole('button',{name:/^프로필 그림 5$/})).toHaveAttribute('aria-pressed','true');await userEvent.click(p.getByRole('button',{name:'다음'}));await userEvent.click(await p.findByRole('button',{name:'다음'}));await userEvent.click(await p.findByRole('button',{name:'시작하기'}));await waitFor(()=>expect(p.getByRole('heading',{name:'환영합니다, 하은님'})).toBeVisible());await expect(JSON.parse(localStorage.getItem('workflow-onboarding')!).digest).toBe(true)}};
test(journey.name,()=>runSample(meta,journey));test('휴대폰 온보딩',()=>runSample(meta,journey,'phone'));
