/** 회사의 업무를 한 캐시에 둔다. 프로젝트의 업무는 키 앞부분(cowork-)으로 고른다. */
export const workItemsKey = ["work-items"] as const

/** 주소의 키는 소문자, 설정은 대문자를 쓰므로 키를 대문자로 맞춰 프로젝트마다 한 캐시를 쓴다. */
export const workflowKey = (projectKey: string) => ["workflow", projectKey.toUpperCase()] as const
