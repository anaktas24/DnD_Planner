interface Props { className?: string }

export function D20Icon({ className }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 8.007v7.986a2 2 0 0 1-1.006 1.735l-7 4.007a2 2 0 0 1-1.988 0l-7-4.007a2 2 0 0 1-1.006-1.735v-7.986a2 2 0 0 1 1.006-1.735l7-4.007a2 2 0 0 1 1.988 0l7 4.007a2 2 0 0 1 1.006 1.735z" />
      <path d="M3.29 6.97l4.21 2.03" />
      <path d="M20.71 6.97l-4.21 2.03" />
      <path d="M20.7 17H3.3" />
      <path d="M11.76 2.03L7.5 9l-4.3 7.84" />
      <path d="M12.24 2.03L16.5 9l4.3 7.84" />
      <path d="M12 17l-4.5-8h9l-4.5 8z" />
      <path d="M12 17v5" />
    </svg>
  )
}
