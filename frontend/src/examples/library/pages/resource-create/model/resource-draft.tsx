import { createContext, useContext, useState, type ReactNode } from "react";
import type { JSONContent } from "@tiptap/react";
import type { ResourceKind } from "../../../entities/resource";
export type ResourceDraft = {
  title: string;
  body?: JSONContent;
  kind: ResourceKind;
  collection: string;
  url: string;
};
const empty: ResourceDraft = {
  title: "",
  kind: "document",
  collection: "",
  url: "",
};
const DraftContext = createContext<{
  draft: ResourceDraft;
  setDraft: (next: ResourceDraft) => void;
  reset: () => void;
} | null>(null);
export function ResourceDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<ResourceDraft>(empty);
  return (
    <DraftContext value={{ draft, setDraft, reset: () => setDraft(empty) }}>
      {children}
    </DraftContext>
  );
}
export function useResourceDraft() {
  const draft = useContext(DraftContext);
  if (!draft) throw new Error("초안 provider가 필요하다.");
  return draft;
}
