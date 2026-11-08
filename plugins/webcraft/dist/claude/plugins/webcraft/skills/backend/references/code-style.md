# 코드 규칙

- 역할을 Controller·Service·Query·Repository·Requests·Views·ErrorCode 이름으로 드러냅니다. 피처별 Service가 읽기·쓰기를 함께 제공합니다. 저장소·조회 구현은 Jooq처럼 기술 이름을 붙이고 QueryRepository처럼 역할을 섞지 않습니다.
- 의존성은 생성자로 주입합니다. 필드·인자는 선언 타입의 lowerCamelCase를 씁니다. Repository·Service 접미사를 생략한 모호한 이름을 피합니다.
- 처음에는 각 계층을 평평하게 두고, domain은 실제 애그리거트, application은 실제 피처·유스케이스가 늘 때 나눕니다. infrastructure는 기술 관심사로 나눕니다. 계층 내부 공용은 해당 계층 루트에 두고, 도메인 규칙·조율·공용·우연한 유사성 순서로 추출 여부를 판단합니다.
- 없을 수 있는 조회는 find와 Optional, 반드시 있어야 하는 조회는 get과 예외를 씁니다. 접근자는 name()처럼 씁니다.
- SQL·jOOQ 타입은 infrastructure에 둡니다. 엔티티는 식별자 동등성, 값은 내용 동등성을 사용합니다. 검증·정규화가 필요한 값에 값 객체를 도입합니다.
- HTTP DTO는 피처의 Requests·Views로 묶고, 공개 계약 전용 타입은 Facade·Spi 내부의 Param·Result로 묶습니다. 불변 값·전달 타입은 record, 접근자는 name() 형식을 기본으로 합니다.
- 현재 시각은 주입한 Clock으로 전달합니다. 도메인은 순수 규칙 위반, 서비스는 부재·권한·충돌 오류를 판정합니다. 예외를 빈 catch나 포괄 catch로 삼키지 않습니다. 오류와 로깅의 책임을 중복시키지 않습니다.
- 테스트는 업무 불변식·원자성·중복 명령·권한처럼 외부에서 관찰할 결과를 검증합니다. formatter·lint·경계 검사는 프로젝트가 채택한 도구로 실행합니다.
