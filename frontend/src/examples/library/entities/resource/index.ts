export {
  ResourceApiContext,
  useResourceApi,
  resourceQueries,
} from "./api/resource-api";
export type { ResourceApi } from "./api/resource-api";
export {
  collections,
  collectionName,
  kindLabels,
  plainText,
  formatDate,
} from "./model/resource";
export type { Resource, ResourceKind, NewResource } from "./model/resource";
export { ResourcePreview } from "./ui/ResourcePreview";
