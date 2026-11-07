import type { Resource } from "../model/resource";
import { Icon } from "../../../shared/ui";
export function ResourcePreview({
  resource,
  compact = false,
}: {
  resource: Resource;
  compact?: boolean;
}) {
  return (
    <div
      className={`resource-preview resource-preview--${resource.kind}`}
      data-compact={compact || undefined}
      aria-hidden="true"
    >
      <div className="resource-preview-paper">
        <Icon name={resource.kind} size={compact ? 20 : 30} />
        {!compact && (
          <>
            <span>
              {resource.kind === "link"
                ? resource.url
                  ? new URL(resource.url).hostname
                  : "웹 자료"
                : resource.kind === "document"
                  ? "읽고 남기는 기록"
                  : "형태와 색의 기록"}
            </span>
            <strong>{resource.title}</strong>
            <div className="resource-preview-lines">
              <i />
              <i />
              <i />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
