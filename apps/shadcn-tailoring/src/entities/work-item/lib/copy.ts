import { toast } from "@/shared/ui/toast"
import type { WorkItem } from "../model/types"

/** 업무 상세의 주소. 라우트 /work-items/$workItemKey와 같다. */
export const workItemHref = (key: string) => `/work-items/${encodeURIComponent(key)}`

const copy = async (text: string, title: string) => {
  try {
    await navigator.clipboard.writeText(text)
    toast.add({ type: "success", title })
  } catch {
    toast.add({ type: "error", title: "복사하지 못했습니다" })
  }
}

/** 업무 키(cowork-14)를 복사하고 알린다. */
export const copyWorkItemKey = (item: Pick<WorkItem, "key">) => copy(item.key, `${item.key}를 복사했습니다`)

/** 업무 상세의 주소를 복사하고 알린다. */
export const copyWorkItemLink = (item: Pick<WorkItem, "key">) => copy(`${location.origin}${workItemHref(item.key)}`, "링크를 복사했습니다")
