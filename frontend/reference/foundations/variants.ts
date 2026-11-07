// theme.ts가 Astryx에 더하는 변형의 타입. astryx theme build가 만드는 선언과 같은 형태다.
declare module '@astryxdesign/core/Button' {
  interface ButtonVariantMap {
    create: true;
    view: true;
    'view-active': true;
    tool: true;
    box: true;
    subtle: true;
  }
}

declare module '@astryxdesign/core/Card' {
  interface CardVariantMap {
    page: true;
  }
}

export {};
