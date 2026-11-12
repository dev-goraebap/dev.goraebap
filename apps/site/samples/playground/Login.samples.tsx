import type { Meta, SampleOf } from "../catalog/types";
import { LoginApp } from "./login/app/LoginApp";

/**
 * 셸 없는 인증 화면(로그인·비밀번호 찾기)을 만들 때 본뜬다. 가운데 카드 한 장, 칸이 비면 칸 곁에 알리고 서버가 거절하면
 * 양식 위 배너로 알린다(어느 칸이 틀렸는지 말하지 않는다). 휴대폰은 카드 없이 화면 전체. 로그인은 모의다.
 */
const meta = {
  title: "Playground (플레이그라운드)/로그인", id: "playground-login", component: LoginApp,
  layout: "fullscreen", height: "40rem", device: "desktop",
} satisfies Meta<typeof LoginApp>;
export default meta;
type Sample = SampleOf<typeof meta>;

export const SignIn: Sample = { name: "로그인", args: { initialPath: "/login" } };
export const Rejected: Sample = { name: "자격 오류", args: { initialPath: "/login", initialEmail: "seoyun@example.com", hasInitialFailure: true } };
export const Forgot: Sample = { name: "비밀번호 찾기", args: { initialPath: "/forgot" } };

export const SignUp: Sample = { name:"회원가입",args:{initialPath:"/signup"} };
export const Otp: Sample = { name:"이메일 인증",args:{initialPath:"/otp"} };
