/** Icon nét riêng của khu quản trị (lấy từ AdminSidebar / Admin*.dc.html). */
export const ADMIN_ICONS = {
  grid: 'M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z',
  cal: 'M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4',
  bag: 'M5 8h14l-1 13H6z M9 8V6a3 3 0 0 1 6 0v2',
  wrench: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z',
  tag: 'M3 12V4h8l9 9-8 8z M7.5 7.5h.01',
  box: 'M3 7l9-4 9 4-9 4z M3 7v10l9 4 9-4V7 M12 11v10',
  doc: 'M6 3h8l4 4v14H6z M14 3v4h4 M9 12h6 M9 16h6',
  star: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z',
  home: 'M3 11l9-8 9 8 M5 9.5V21h14V9.5',
  menu: 'M4 6h16 M4 12h16 M4 18h10',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2',
  card: 'M3 6h18v12H3z M3 10h18 M7 15h4',
  shield: 'M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z M8.5 12l2.5 2.5 4.5-5',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M20 20l-4-4',
  plus: 'M12 5v14 M5 12h14',
  grip: 'M9 6h.01 M15 6h.01 M9 12h.01 M15 12h.01 M9 18h.01 M15 18h.01',
  upload: 'M12 16V4 M7 9l5-5 5 5 M4 16v4h16v-4',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  cross: 'M7 7l10 10 M17 7L7 17',
} as const;

export type AdminIconName = keyof typeof ADMIN_ICONS;

export function AdminIcon({ name, size = 18, strokeWidth = 1.75 }: { name: AdminIconName; size?: number; strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ flex: 'none' }}
    >
      <path d={ADMIN_ICONS[name]} />
    </svg>
  );
}
