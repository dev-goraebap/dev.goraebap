import type { ReactNode } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Icon } from "../../foundations/Icon";
export function PageLayout({
  title,
  icon,
  onBack,
  backLabel = "이전으로",
  actions,
  create,
  toolbar,
  applied,
  notice,
  footer,
  children,
  isDetail = false,
  hasBodyHeading = false,
}: {
  title: string;
  icon?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  actions?: ReactNode;
  create?: { label: string; onClick: () => void };
  toolbar?: ReactNode;
  applied?: ReactNode;
  notice?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  isDetail?: boolean;
  hasBodyHeading?: boolean;
}) {
  return (
    <section
      className="library-page"
      aria-label={title}
      data-detail={isDetail || undefined}
    >
      <header className="library-page-header">
        <div className="library-breadcrumb">
          {onBack ? (
            <Button
              label={backLabel}
              isIconOnly
              icon={<Icon name="arrow" />}
              variant="ghost"
              onClick={onBack}
            />
          ) : (
            icon
          )}
          {hasBodyHeading ? <span>{title}</span> : <h1>{title}</h1>}
        </div>
        <div className="library-header-actions">
          {actions}
          {create && (
            <Button
              className="library-desktop-create"
              label={create.label}
              variant="create"
              icon={<Icon name="plus" size={16} />}
              onClick={create.onClick}
            />
          )}
        </div>
      </header>
      {notice}
      {toolbar}
      {applied}
      {children}
      {footer}
      {create && (
        <Button
          className="library-fab"
          label={create.label}
          tooltip={create.label}
          isIconOnly
          variant="create"
          icon={<Icon name="plus" size={24} />}
          onClick={create.onClick}
        />
      )}
    </section>
  );
}
export function PageNotice({
  children,
  onRetry,
}: {
  children: ReactNode;
  onRetry?: () => void;
}) {
  return (
    <div className="library-page-notice" role="alert">
      <Icon name="info" size={16} />
      <span>{children}</span>
      {onRetry && (
        <Button label="다시 시도" variant="ghost" onClick={onRetry} />
      )}
    </div>
  );
}
