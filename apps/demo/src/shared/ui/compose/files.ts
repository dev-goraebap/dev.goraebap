export const MB = 1024 * 1024

/** 파일 크기의 글자: 1 MB부터 소수 한 자리 MB, 그 아래는 KB(0도 1 KB). */
export function fileSizeText(bytes: number) {
  if (bytes >= MB) return `${(bytes / MB).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

/** 같은 파일인지 가리는 열쇠. 이름 · 크기 · 고친 때가 같으면 같은 파일로 본다. */
export const fileKey = (file: File) => `${file.name}:${file.size}:${file.lastModified}`

/** 고른 파일을 이미 든 것 뒤에 붙인다. 같은 파일을 두 번 고르면 하나만 남긴다. */
export function mergeFiles(current: File[], added: File[]) {
  const unique = new Map(current.map(file => [fileKey(file), file]))
  for (const file of added) if (!unique.has(fileKey(file))) unique.set(fileKey(file), file)
  return [...unique.values()]
}
