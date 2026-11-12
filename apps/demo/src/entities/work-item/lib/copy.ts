import { workItemPath } from "@/shared/config"
import { toast } from "@/shared/ui/toast"
import type { WorkItem } from "../model/types"

/** 업무 상세의 주소(/projects/cowork/work-items/14). */
export const workItemHref = workItemPath

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
