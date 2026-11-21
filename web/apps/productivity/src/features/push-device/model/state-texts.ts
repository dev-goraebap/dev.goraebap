import type { DeviceState } from './use-this-device';

/** What this browser's push state means for the member, and what they can do about it. */
export const stateTexts: Record<DeviceState, { summary: string; help?: string }> = {
  checking: { summary: '확인하는 중…' },
  'not-configured': { summary: '사용할 수 없음', help: '이 서버에는 아직 푸시 알림이 설정되지 않았습니다. 관리자에게 문의해 주세요. 앱 안 알림은 그대로 받습니다.' },
  unsupported: { summary: '지원하지 않는 브라우저', help: '이 브라우저는 푸시 알림을 지원하지 않습니다. Chrome, Edge, Firefox, Safari 최신 버전에서 켤 수 있습니다.' },
  insecure: { summary: '보안 연결 필요', help: '푸시 알림은 보안 연결(HTTPS)에서만 켤 수 있습니다.' },
  ios: { summary: '홈 화면 앱에서만 지원', help: 'iPhone·iPad는 홈 화면에 추가한 웹 앱에서만 푸시 알림을 받을 수 있어 지금은 켤 수 없습니다. 앱 안 알림을 이용해 주세요.' },
  blocked: {
    summary: '브라우저에서 차단됨',
    help: '브라우저가 이 사이트의 알림을 막고 있습니다. 주소창 왼쪽의 사이트 정보(자물쇠 모양)를 눌러 알림을 ‘허용’으로 바꾼 뒤 이 화면을 새로 고쳐 주세요.',
  },
  off: { summary: '꺼짐', help: '켜면 브라우저가 알림을 허용할지 한 번 묻습니다.' },
  on: { summary: '켜짐', help: '브라우저가 실행 중이면 이 사이트 창을 닫아도 알림이 옵니다.' },
};
