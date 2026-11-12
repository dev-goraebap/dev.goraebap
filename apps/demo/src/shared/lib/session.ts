/**
 * 로그인 세션(목업). 서버가 없으므로 이 브라우저의 localStorage에 들어온 표시만 둔다. 라우터가 셸에 들어가기 전에
 * isSignedIn으로 확인하고, 아니면 /login?redirect=원래 주소로 보낸다(호호코워크 AuthLayout). 저장소를 못 쓰면 늘 들어온 것으로 본다.
 */
const KEY = "cowork-session"

export function isSignedIn() {
  try {
    return localStorage.getItem(KEY) !== null
  } catch {
    return true
  }
}

/** 들어온 표시를 남긴다. email은 기억만 한다(목업은 늘 같은 "나"다). */
export function signIn(email: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ email, at: new Date().toISOString() }))
  } catch {
    // 저장소를 못 쓰면 isSignedIn이 늘 true라 그대로 들어간다.
  }
}

export function signOut() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // 위와 같다.
  }
}

/** 로그인 뒤 돌아갈 주소. 앱 안의 경로만 받는다(다른 사이트로 보내는 열린 리다이렉트를 막는다). */
export function safeRedirect(value: unknown) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/login") ? value : undefined
}
