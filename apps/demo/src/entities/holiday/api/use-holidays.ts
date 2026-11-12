import { useQuery } from "@tanstack/react-query"
import type { Holiday } from "../model/types"
import { mockHolidays } from "./mock"

/** 공휴일. 서버가 없으므로 약 300ms 뒤에 목 데이터를 돌려준다. 해마다 한 번 정해져 다시 읽지 않는다. */
export function useHolidays() {
  return useQuery({
    queryKey: ["holidays"],
    queryFn: () => new Promise<Holiday[]>(resolve => setTimeout(() => resolve(mockHolidays), 300)),
    staleTime: Infinity,
  })
}
