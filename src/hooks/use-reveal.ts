/**
 * The entrance animation for a page's cards.
 *
 * Tied to a *load completing* rather than to a page load. A card rising into
 * place is saying "this just arrived", so the animation belongs exactly where
 * data arrives — after sign-in, after the first fetch, after anything that put
 * a spinner on screen.
 *
 * Navigating back to a page whose data is already cached never shows a spinner,
 * so there is nothing to announce and the cards simply appear. That falls out
 * of the same rule rather than needing a flag of its own.
 */

import { useState } from "react";
import { usePreferences } from "@/providers";

export const useReveal = (isLoading = false) => {
    const { preferences } = usePreferences();

    // The loading state as it was when this page mounted, captured once.
    // Mounted mid-load means a spinner was shown and the cards are worth
    // announcing; mounted already-loaded means the data was cached and they
    // are not. Reading it live would re-arm the animation on every refetch.
    const [mountedWhileLoading] = useState(isLoading);

    const active = !isLoading && mountedWhileLoading && !preferences.reduceMotion;

    /** `index` is the card's place in the stagger, 0 first. */
    return (index = 0) => (active ? `reveal reveal-${Math.min(index, 5)}` : "");
};
