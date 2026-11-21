/**
 * crypto.randomUUID는 보안 맥락(https · localhost)에서만 있다. 같은 네트워크의 휴대폰에서 개발 서버를 http 주소(192.168.x.x)로 열면
 * 없어서, 본문 편집기 · 첨부 올리기가 부르는 순간 화면이 오류로 넘어갔다. 그때만 같은 모양(RFC 4122 v4)의 값을
 * crypto.getRandomValues로 만든다(이 함수는 보안 맥락이 아니어도 있다). 운영 · hr-dev는 https라 브라우저의 것을 그대로 쓴다.
 */
if (typeof crypto.randomUUID !== 'function') {
  crypto.randomUUID = () => {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6]! & 0x0f) | 0x40;
    bytes[8] = (bytes[8]! & 0x3f) | 0x80;
    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}` as ReturnType<Crypto['randomUUID']>;
  };
}
