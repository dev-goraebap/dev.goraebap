import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@goraebap/ui-react/components/button";
import { DominantColorImage } from "./DominantColorImage";

export interface PromoBannerCardProps {
  imageSrc: string;
  imageAlt: string;
  imageColor?: string;
  title: string;
  badge?: string;
  description: string;
  ctaLabel: string;
  ctaTo: string;
}

export function PromoBannerCard({
  imageSrc,
  imageAlt,
  imageColor,
  title,
  badge,
  description,
  ctaLabel,
  ctaTo,
}: PromoBannerCardProps) {
  return (
    <aside
      aria-label={title}
      className="border-border bg-card overflow-hidden rounded-2xl border shadow-xs"
    >
      <DominantColorImage
        src={imageSrc}
        alt={imageAlt}
        dominantColor={imageColor}
        className="aspect-[16/9] w-full"
      />
      <div className="space-y-3 p-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <h2 className="text-foreground text-sm leading-snug font-semibold tracking-tight">
              {title}
            </h2>
            {badge && (
              <span className="border-border bg-secondary text-muted-foreground rounded-full border px-1.5 py-px font-mono text-[0.625rem] leading-tight">
                {badge}
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed break-keep">{description}</p>
        </div>
        <Link
          to={ctaTo}
          className={buttonVariants({
            variant: "default",
            size: "sm",
            className: "w-full justify-center",
          })}
        >
          {ctaLabel}
        </Link>
      </div>
    </aside>
  );
}
