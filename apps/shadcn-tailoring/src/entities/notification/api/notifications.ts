import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { notifications } from "../model/mock"
import type { ApprovalDecision, Notification } from "../model/types"

const KEY = ["notifications"] as const

/** 서버 대신 쓰는 메모리 저장소. 바꾼 것은 새로고침 전까지 남는다. */
let store: Notification[] = notifications
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/** 받은 알림 전체(최근 것이 먼저). 목업이라 약 400ms 뒤에 돌려준다. */
export function useNotifications() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      await wait(400)
      return store
    },
  })
}

/** 알림 목록을 바꾸는 요청. 화면에는 바로 반영하고(낙관적 갱신) 저장소에는 잠시 뒤에 쓴다. */
function useNotificationsChange<Vars>(change: (items: Notification[], vars: Vars) => Notification[]) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (vars: Vars) => {
      await wait(200)
      store = change(store, vars)
      return store
    },
    onMutate: vars => queryClient.setQueryData<Notification[]>(KEY, items => items && change(items, vars)),
  })
}

const update = (items: Notification[], id: string, patch: (item: Notification) => Notification) =>
  items.map(item => (item.id === id ? patch(item) : item))

/** 알림 하나를 읽음 · 읽지 않음으로. */
export const useMarkNotification = () =>
  useNotificationsChange<{ id: string; isUnread: boolean }>((items, { id, isUnread }) =>
    update(items, id, item => ({ ...item, isUnread })))

/** 모든 알림을 읽음으로. */
export const useReadAllNotifications = () =>
  useNotificationsChange<void>(items => items.map(item => ({ ...item, isUnread: false })))

/** 결재 요청을 승인 · 반려한다. 결재를 마친 요청은 "최근 소식"으로 옮겨진다. */
export const useDecideApproval = () =>
  useNotificationsChange<{ id: string; decision: ApprovalDecision }>((items, { id, decision }) =>
    update(items, id, item => (item.kind === "approval" ? { ...item, decision, isUnread: false } : item)))
