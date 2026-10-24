/**
 * Line art for the empty states. Drawn rather than imported: every shape is
 * `currentColor` or a brand token, so they follow the accent and both themes
 * without a second asset. Kept to the app's own geometry — generous corner
 * radii, 1.5px strokes, round caps — so they read as part of the furniture
 * rather than clip art dropped on top.
 */

const stroke = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round",
    strokeLinejoin: "round",
} as const;

/** Wraps each drawing: muted by default, with the accent reserved for one part. */
const Art = ({ children, label }: { children: React.ReactNode; label: string }) => (
    <svg viewBox="0 0 96 64" role="img" aria-label={label} className="h-16 w-24 shrink-0 text-quaternary">
        {children}
    </svg>
);

/** Two cards, the front one still blank — what the hero is missing. */
export const NoAccountsArt = () => (
    <Art label="">
        <g opacity="0.5">
            <rect x="22" y="10" width="46" height="30" rx="6" transform="rotate(-8 45 25)" {...stroke} />
        </g>
        <rect x="26" y="20" width="48" height="32" rx="7" {...stroke} />
        <rect x="32" y="27" width="10" height="7" rx="2" className="text-brand" fill="currentColor" opacity="0.9" />
        <path d="M32 44h16" {...stroke} className="text-brand" />
        <path d="M54 44h12" {...stroke} opacity="0.6" />
    </Art>
);

/** A month with one day marked — nothing is due yet. */
export const NoUpcomingArt = () => (
    <Art label="">
        <rect x="24" y="12" width="48" height="42" rx="7" {...stroke} />
        <path d="M24 24h48M36 12v-4M60 12v-4" {...stroke} />
        <circle cx="36" cy="34" r="2" fill="currentColor" opacity="0.5" />
        <circle cx="48" cy="34" r="2" fill="currentColor" opacity="0.5" />
        <circle cx="60" cy="34" r="3" className="text-brand" fill="currentColor" />
        <circle cx="36" cy="45" r="2" fill="currentColor" opacity="0.5" />
        <circle cx="48" cy="45" r="2" fill="currentColor" opacity="0.5" />
    </Art>
);

/** Two flat lines waiting for months to pull them apart. */
export const NoFlowArt = () => (
    <Art label="">
        <path d="M16 52h64" {...stroke} opacity="0.4" />
        <path d="M18 34c8 0 10-6 18-6s12 8 20 8 10-7 20-7" {...stroke} className="text-brand" />
        <path d="M18 44c8 0 12 3 20 3s12-4 20-4 10 4 20 4" {...stroke} opacity="0.55" />
        <circle cx="76" cy="29" r="2.5" className="text-brand" fill="currentColor" />
    </Art>
);

/** A target with nothing aimed at it yet. */
export const NoGoalsArt = () => (
    <Art label="">
        <circle cx="48" cy="32" r="19" {...stroke} opacity="0.45" />
        <circle cx="48" cy="32" r="11" {...stroke} opacity="0.7" />
        <circle cx="48" cy="32" r="3.5" className="text-brand" fill="currentColor" />
        <path d="M48 32l18-14" {...stroke} className="text-brand" />
        <path d="M66 18l-1 6 6-1-5-5z" className="text-brand" fill="currentColor" stroke="none" />
    </Art>
);

/** An empty ledger: rows with nothing written on them. */
export const NoActivityArt = () => (
    <Art label="">
        <rect x="20" y="12" width="56" height="40" rx="7" {...stroke} />
        <circle cx="31" cy="24" r="3" className="text-brand" fill="currentColor" />
        <path d="M40 24h20" {...stroke} className="text-brand" />
        <circle cx="31" cy="34" r="3" fill="currentColor" opacity="0.45" />
        <path d="M40 34h26" {...stroke} opacity="0.55" />
        <circle cx="31" cy="44" r="3" fill="currentColor" opacity="0.3" />
        <path d="M40 44h14" {...stroke} opacity="0.35" />
    </Art>
);
