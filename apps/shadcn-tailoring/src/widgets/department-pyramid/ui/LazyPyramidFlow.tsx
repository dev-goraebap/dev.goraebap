import { lazy } from "react"

/** 캔버스 라이브러리(React Flow)는 조직도에서만 쓰므로 앱과 함께가 아니라 조직도 뷰를 처음 그릴 때 불러온다. */
export const preparePyramidFlow = () => import("./PyramidFlow").then(module => ({ default: module.PyramidFlow }))
export const LazyPyramidFlow = lazy(preparePyramidFlow)
