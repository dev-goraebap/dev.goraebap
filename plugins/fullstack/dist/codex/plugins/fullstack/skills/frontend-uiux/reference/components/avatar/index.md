# Avatar

사용자, 팀, 워크스페이스를 프로필 이미지나 이니셜로 빠르게 식별할 때 씁니다. 이미지가 없거나 불러오기에 실패하면 자동으로 대체 표시를 보여 줍니다.

스택별 구현: [react.md](react.md#usage) · [angular.md](angular.md#usage)의 「usage」 절

## 구성

| 부분 | 역할 |
| - | - |
| Avatar | 크기와 원형·사각 비율을 지정하는 외곽 컨테이너입니다. |
| AvatarImage | 실제 프로필 이미지를 표시하는 요소입니다. |
| AvatarFallback | 이미지가 없거나 로드에 실패했을 때 이니셜이나 아이콘을 보여 줍니다. |

## 접근성

- AvatarImage에는 사용자 이름을 담은 alt 텍스트를 적고, 옆에 이름이 이미 표기되어 있으면 빈 alt로 중복 낭독을 피합니다.
- AvatarFallback에는 1\~2글자 이니셜을 넣어 배경과의 명도 대비를 유지합니다.

## 관련 컴포넌트

- [Badge](../badge/index.md): 사람이나 팀 식별이 아니라 상태나 분류 라벨을 붙일 때 씁니다.
- [Preview Card](../preview-card/index.md): 아바타에 호버했을 때 프로필 요약 카드를 함께 보여 줄 때 씁니다.
