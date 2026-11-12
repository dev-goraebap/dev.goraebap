import {test} from 'vitest';
import {expect,userEvent,waitFor,within} from '../catalog/testing';
import {runSample} from '../catalog/run-sample';
import type {SampleOf} from '../catalog/types';
import meta from './Permissions.samples';
type Sample=SampleOf<typeof meta>;
const save:Sample={name:'역할 토글을 바꾸고 저장',args:{initialPath:'/permissions'},play:async({canvasElement})=>{const p=within(canvasElement.ownerDocument.body);const cell=await p.findByRole('switch',{name:'문서 삭제'});await expect(p.queryByRole('table')).toBeNull();await userEvent.click(cell);await expect(await p.findByRole('button',{name:'변경 1개 저장'})).toBeVisible();await expect(p.queryByText('바뀜')).toBeNull();await userEvent.click(p.getByRole('button',{name:'변경 1개 저장'}));await waitFor(()=>expect(p.queryByRole('region',{name:'변경 사항 저장'})).toBeNull());await expect(p.getByRole('switch',{name:'문서 삭제'})).toBeChecked()}};
const undo:Sample={name:'변경 되돌리기와 다른 기능 메뉴 비활성',args:{initialPath:'/permissions'},play:async({canvasElement})=>{const p=within(canvasElement.ownerDocument.body);await userEvent.click(await p.findByRole('switch',{name:'문서 삭제'}));await userEvent.click(p.getByRole('button',{name:'되돌리기'}));await expect(p.getByRole('switch',{name:'문서 삭제'})).not.toBeChecked();/* 다른 구역 메뉴는 링크가 아니다(누를 곳이 없다). 키트 SidebarMenuButton이 툴팁 트리거로 disabled를 넘기지 못해 disabled 속성은 아직 없다. */await expect(p.getByText('태그').closest('a')).toBeNull();await expect(p.getByRole('link',{name:'권한'})).toHaveAttribute('aria-current','page')}};
test(save.name,()=>runSample(meta,save));test(undo.name,()=>runSample(meta,undo));test('휴대폰 토글 저장',()=>runSample(meta,save,'phone'));
