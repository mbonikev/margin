/** Coffee cup, drawn to match the Heroicons v2 outline style (24px, 1.5px, round caps). */
export const Coffee = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9h13v5.5a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V9Z" />
        <path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16" />
        <path d="M7 2.5v3M11 2.5v3M15 2.5v3" />
    </svg>
);
