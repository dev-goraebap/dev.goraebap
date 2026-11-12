import type { Member, MemberStatus } from "../model/types"

/*
 * 구성원 25명(모의). 부서마다 부서장이 있고, 모든 상태가 한 번 이상 나온다. 메일은 아이디로, 번호는 줄 번호로 만든다.
 */
type Seed = [id: string, name: string, departmentId: string, rank: string, position: string | undefined, status: MemberStatus, joinedAt: string]

const SEEDS: Seed[] = [
  ["emp-han", "한지석", "dept-exec", "대표", "대표이사", "working", "2016-03-02"],
  ["emp-yoon", "윤서현", "dept-ops", "부장", "팀장", "working", "2017-01-09"],
  ["emp-kang", "강도현", "dept-ops", "과장", undefined, "outside", "2019-07-01"],
  ["emp-jung", "정민재", "dept-ops", "대리", undefined, "working", "2021-02-15"],
  ["emp-choi", "최유나", "dept-ops", "사원", undefined, "leave", "2023-09-04"],
  ["emp-hong", "홍지아", "dept-ops", "사원", undefined, "working", "2024-03-04"],
  ["emp-goh", "고재범", "dept-dev", "차장", "팀장", "working", "2018-05-14"],
  ["emp-lee", "이도윤", "dept-dev", "과장", undefined, "remote", "2019-11-18"],
  ["emp-oh", "오세훈", "dept-dev", "과장", undefined, "working", "2020-04-06"],
  ["emp-park", "박서준", "dept-dev", "대리", undefined, "working", "2021-08-02"],
  ["emp-lim", "임채원", "dept-dev", "대리", undefined, "remote", "2022-01-03"],
  ["emp-song", "송민호", "dept-dev", "사원", undefined, "away", "2024-01-08"],
  ["emp-noh", "노은재", "dept-dev", "사원", undefined, "working", "2025-03-03"],
  ["emp-kim", "김하늘", "dept-design", "과장", "팀장", "working", "2019-03-11"],
  ["emp-baek", "백승우", "dept-design", "대리", undefined, "leave", "2021-06-14"],
  ["emp-seo", "서지우", "dept-design", "대리", undefined, "working", "2022-05-02"],
  ["emp-moon", "문예린", "dept-design", "사원", undefined, "remote", "2024-07-01"],
  ["emp-cho", "조현우", "dept-sales", "부장", "팀장", "outside", "2017-09-04"],
  ["emp-shin", "신아름", "dept-sales", "과장", undefined, "outside", "2019-02-18"],
  ["emp-ryu", "류태경", "dept-sales", "대리", undefined, "working", "2022-10-04"],
  ["emp-hwang", "황보은", "dept-sales", "사원", undefined, "working", "2025-01-06"],
  ["emp-bae", "배수진", "dept-marketing", "차장", "팀장", "working", "2018-08-20"],
  ["emp-ahn", "안준영", "dept-marketing", "대리", undefined, "away", "2021-04-12"],
  ["emp-namgung", "남궁하은", "dept-marketing", "사원", undefined, "working", "2023-03-06"],
  ["emp-jang", "장민서", "dept-marketing", "사원", undefined, "leave", "2024-09-02"],
]

export const mockMembers: Member[] = SEEDS.map(([id, name, departmentId, rank, position, status, joinedAt], index) => ({
  id, name, departmentId, rank, position, status, joinedAt,
  email: `${id.slice(4)}@hohocompany.kr`,
  phone: `010-${String(2400 + index * 137).padStart(4, "0")}-${String(1000 + index * 311).slice(-4)}`,
}))
