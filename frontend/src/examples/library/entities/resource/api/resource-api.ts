import { createContext, useContext } from "react";
import { queryOptions } from "@tanstack/react-query";
import type { NewResource, Resource } from "../model/resource";
export interface ResourceApi {
  list(signal?: AbortSignal): Promise<Resource[]>;
  get(id: string, signal?: AbortSignal): Promise<Resource>;
  create(input: NewResource): Promise<Resource>;
  update(
    id: string,
    patch: Partial<Pick<Resource, "starred">>,
  ): Promise<Resource>;
}
export const ResourceApiContext = createContext<ResourceApi | null>(null);
export function useResourceApi() {
  const api = useContext(ResourceApiContext);
  if (!api) throw new Error("ResourceApi provider가 필요하다.");
  return api;
}
export const resourceQueries = {
  all: (api: ResourceApi) =>
    queryOptions({
      queryKey: ["resources"],
      queryFn: ({ signal }) => api.list(signal),
      staleTime: 30_000,
    }),
  detail: (api: ResourceApi, id: string) =>
    queryOptions({
      queryKey: ["resource", id],
      queryFn: ({ signal }) => api.get(id, signal),
      staleTime: 30_000,
    }),
};
