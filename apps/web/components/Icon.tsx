import { ICONS, isIconName, type IconName } from '@kitfix/ui';

interface Props {
  name: IconName | string;
  size?: number;
  strokeWidth?: number;
  filled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/** Icon nét 24×24, kế thừa currentColor. Luôn aria-hidden — nghĩa nằm ở chữ đi kèm. */
export function Icon({ name, size = 20, strokeWidth = 1.75, filled = false, className, style }: Props) {
  const d = isIconName(name) ? ICONS[name] : ICONS.wrench;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={style}
    >
      <path d={d} />
    </svg>
  );
}
