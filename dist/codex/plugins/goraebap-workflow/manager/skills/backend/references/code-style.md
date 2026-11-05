# 코드 규칙

- 역할을 Controller·Service·QueryService·Query·Repository·Requests·Views·ErrorCode 이름으로 드러낸다. 저장소 구현은 Jooq처럼 기술 이름을 붙이고 QueryRepository처럼 역할을 섞지 않는다.
- 의존성은 생성자로 주입한다. 필드·인자는 선언 타입의 lowerCamelCase를 쓴다. Repository·Service 접미사를 생략한 모호한 이름을 피한다.
- 처음에는 각 계층을 평평하게 두고, domain은 실제 애그리거트, application은 실제 인바운드 자원이 늘 때 나눈다. infrastructure는 기술 관심사로 나눈다. 임의의 common 패키지를 만들지 않는다.
- 없을 수 있는 조회는 find와 Optional, 반드시 있어야 하는 조회는 get과 예외를 쓴다. 접근자는 name()처럼 쓴다.
- SQL·jOOQ 타입은 infrastructure에 둔다. 엔티티는 식별자 동등성, 값은 내용 동등성을 사용한다. 검증·정규화가 필요한 값에 값 객체를 도입한다.
- 현재 시각은 주입한 Clock으로 전달한다. 예외를 빈 catch나 포괄 catch로 삼키지 않는다. 오류와 로깅의 책임을 중복시키지 않는다.
- 테스트는 업무 불변식·원자성·중복 명령·권한처럼 외부에서 관찰할 결과를 검증한다. formatter·lint·경계 검사는 프로젝트가 채택한 도구로 실행한다.
