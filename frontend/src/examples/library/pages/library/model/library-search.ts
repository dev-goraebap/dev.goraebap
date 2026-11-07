export type LibrarySearch = {
  q: string;
  author?: string;
  kind: "all" | "link" | "document" | "image";
  view: "grid" | "list";
  sort: "updated" | "title";
  collection?: string;
  starred?: boolean;
  panel?: string;
};
export function validateLibrarySearch(
  raw: Record<string, unknown>,
): LibrarySearch {
  return {
    q: typeof raw.q === "string" ? raw.q : "",
    author:
      typeof raw.author === "string" && raw.author ? raw.author : undefined,
    kind: ["link", "document", "image"].includes(String(raw.kind))
      ? (raw.kind as LibrarySearch["kind"])
      : "all",
    view: raw.view === "list" ? "list" : "grid",
    sort: raw.sort === "title" ? "title" : "updated",
    collection: typeof raw.collection === "string" ? raw.collection : undefined,
    starred: raw.starred === true || raw.starred === "true" || undefined,
    panel:
      typeof raw.panel === "string" &&
      /^\/resources\/(new|[a-zA-Z0-9-]+)$/.test(raw.panel)
        ? raw.panel
        : undefined,
  };
}
