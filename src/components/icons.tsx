type IconProps = {
  name: IconName
  className?: string
}

const PATHS = {
  sun: 'M12 4V2m0 20v-2m8-8h2M2 12h2m13.66-5.66l1.41-1.41M4.93 19.07l1.41-1.41m0-11.32L4.93 4.93m14.14 14.14l-1.41-1.41M16 12a4 4 0 11-8 0 4 4 0 018 0z',
  star: 'M12 3.5l2.6 5.27 5.82.85-4.21 4.1.99 5.78L12 16.77l-5.2 2.73.99-5.78-4.21-4.1 5.82-.85L12 3.5z',
  calendar:
    'M4 8h16M7 3v3m10-3v3M5.5 5h13A1.5 1.5 0 0120 6.5v13a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 19.5v-13A1.5 1.5 0 015.5 5z',
  briefcase:
    'M4 8.5h16A1.5 1.5 0 0121.5 10v8A1.5 1.5 0 0120 19.5H4A1.5 1.5 0 012.5 18v-8A1.5 1.5 0 014 8.5zM9 8.5V6.5A1.5 1.5 0 0110.5 5h3A1.5 1.5 0 0115 6.5v2',
  plus: 'M12 5v14M5 12h14',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  trash: 'M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3',
  note: 'M5 4.5h14v10L14.5 19H5v-14.5zM14.5 19v-4.5H19',
  close: 'M6 6l12 12M18 6L6 18',
  chevronRight: 'M9.5 5.5l6.5 6.5-6.5 6.5',
  chevronDown: 'M5.5 9.5l6.5 6.5 6.5-6.5',
  infinity:
    'M8.2 8.8a3.2 3.2 0 100 6.4c2.2 0 2.9-3.2 3.8-3.2s1.6 3.2 3.8 3.2a3.2 3.2 0 100-6.4c-2.2 0-2.9 3.2-3.8 3.2S10.4 8.8 8.2 8.8z',
} satisfies Record<string, string>

export type IconName = keyof typeof PATHS

export function Icon({ name, className }: IconProps) {
  return (
    <svg
      className={className ? `w-[18px] h-[18px] shrink-0 ${className}` : 'w-[18px] h-[18px] shrink-0'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}

export function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="w-[18px] h-[18px] shrink-0"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS.star} />
    </svg>
  )
}
