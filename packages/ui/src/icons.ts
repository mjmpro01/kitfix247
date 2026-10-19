// Bộ icon nét (stroke 1.75, khung 24×24) lấy từ artboard. Icon kế thừa currentColor.
export const ICONS = {
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2',
  phoneRing:
    'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2 M15 3a6 6 0 0 1 6 6 M15 6.5a2.5 2.5 0 0 1 2.5 2.5',
  chat: 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z',
  calendar: 'M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  star: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 7v5l3 2',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  chevron: 'M6 9l6 6 6-6',
  menu: 'M4 7h16 M4 12h16 M4 17h16',
  close: 'M6 6l12 12 M18 6L6 18',
  pin: 'M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z M12 7a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  cart: 'M3 4h2.5l2.2 11h10.6L20.5 7H6.5 M9 19.5h.01 M17 19.5h.01',
  burner: 'M3 5h18v14H3z M8.5 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z M16 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  infrared: 'M3 5h18v14H3z M8.5 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z M13.5 12c.8-1 1.5-1 2.2 0s1.5 1 2.3 0',
  hood: 'M9 3h6v6l5 6H4l5-6z M4 15v3h16v-3',
  oven: 'M4 4h16v16H4z M4 9h16 M8 6.5h.01 M11 6.5h.01 M8 12h8v5H8z',
  microwave: 'M3 6h18v12H3z M6 9h9v6H6z M18 9v.01 M18 12v.01 M18 15v.01',
  dishwasher: 'M5 3h14v18H5z M5 7h14 M12 10a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  wrench: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z',
  shield: 'M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z M8.5 12l2.5 2.5 4.5-5',
  award: 'M12 3a6 6 0 1 0 0 12 6 6 0 0 0 0-12z M8.5 14L7 21l5-3 5 3-1.5-7',
  truck: 'M2 6h12v10H2z M14 9h4l3 3v4h-7 M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2z M9 8h6 M9 12h6 M9 16h3',
  heart: 'M12 20s-7-4.4-9-9a4.5 4.5 0 0 1 9-3 4.5 4.5 0 0 1 9 3c-2 4.6-9 9-9 9z',
  screw: 'M9 3h6l-1 4h-4z M12 7v14 M9 11h6 M9 15h6',
  paste: 'M8 3h8v5H8z M7 8h10l-1 13H8z M12 12v5',
  fuse: 'M3 12h3 M18 12h3 M6 9h12v6H6z M9 9v6 M15 9v6',
  plug: 'M9 3v5 M15 3v5 M6 8h12v3a6 6 0 0 1-12 0z M12 17v4',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M20 20l-4-4',
  image: 'M3 5h18v14H3z M3 16l5-5 4 4 3-3 6 6 M15.5 8.5h.01',
} as const;

export type IconName = keyof typeof ICONS;

export function isIconName(v: string): v is IconName {
  return Object.prototype.hasOwnProperty.call(ICONS, v);
}
