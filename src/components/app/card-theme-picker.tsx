import type { CardTheme } from "@/components/app/account-card";
import { cardThemeClass, cardThemes } from "@/components/app/account-card";
import { cx } from "@/utils/cx";

/** Shared so creating an account and editing one offer the same choice. */
export const CardThemePicker = ({ value, onChange }: { value: CardTheme; onChange: (theme: CardTheme) => void }) => (
    <span className="mt-1.5 flex flex-wrap gap-2">
        {cardThemes.map((theme) => (
            <button
                key={theme}
                type="button"
                aria-label={theme}
                aria-pressed={value === theme}
                onClick={() => onChange(theme)}
                className={cx(
                    "size-8 rounded-full transition duration-100 ease-linear",
                    cardThemeClass(theme),
                    value === theme ? "ring-2 ring-brand ring-offset-2 ring-offset-popover" : "opacity-70 hover:opacity-100",
                )}
            />
        ))}
    </span>
);
