import { solarIcons, solarSelectedIcons } from "./solar-icons";
export function Icon({
  name,
  size = 16,
  selected = false,
}: {
  name: keyof typeof solarIcons;
  size?: number;
  selected?: boolean;
}) {
  const body = selected ? solarSelectedIcons[name] : solarIcons[name];
  return (
    <svg
      width={`${size / 16}rem`}
      height={`${size / 16}rem`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}
