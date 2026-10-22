import { HiCheck, HiOutlineComputerDesktop, HiOutlineMoon, HiOutlineSun } from "react-icons/hi2";
import type { ThemeMode } from "@/providers/theme-provider";
import { accentColors, useTheme } from "@/providers/theme-provider";
import { cx } from "@/utils/cx";

const modes: { id: ThemeMode; label: string; icon: typeof HiOutlineSun }[] = [
    { id: "light", label: "Light", icon: HiOutlineSun },
    { id: "dark", label: "Dark", icon: HiOutlineMoon },
    { id: "system", label: "System", icon: HiOutlineComputerDesktop },
];

export const ThemeControls = () => {
    const { mode, setMode, accent, setAccent } = useTheme();

    return (
        <div className="px-2 py-1.5">
            <p className="px-1.5 pb-1.5 text-xs font-medium text-quaternary">Theme</p>

            <div className="flex items-center gap-0.5 rounded-full bg-secondary p-0.5">
                {modes.map((item) => {
                    const Icon = item.icon;
                    const isActive = mode === item.id;

                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setMode(item.id)}
                            aria-pressed={isActive}
                            className={cx(
                                "flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full text-xs font-medium transition duration-100 ease-linear",
                                isActive ? "bg-brand-solid text-white" : "text-tertiary hover:text-secondary",
                            )}
                        >
                            <Icon className="size-4" />
                            {item.label}
                        </button>
                    );
                })}
            </div>

            <p className="px-1.5 pt-3 pb-2 text-xs font-medium text-quaternary">Accent</p>

            <div className="flex flex-wrap gap-1.5 px-1.5 pb-1">
                {accentColors.map((color) => {
                    const isActive = accent.id === color.id;

                    return (
                        <button
                            key={color.id}
                            type="button"
                            onClick={() => setAccent(color.id)}
                            aria-label={color.label}
                            aria-pressed={isActive}
                            title={color.label}
                            style={{ backgroundColor: color.hex }}
                            className={cx(
                                "flex size-6 items-center justify-center rounded-full transition duration-100 ease-linear",
                                !isActive && "hover:scale-110",
                            )}
                        >
                            {isActive && <HiCheck className="size-4 text-white" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
