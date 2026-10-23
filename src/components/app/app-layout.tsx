import { HiOutlineArrowPath, HiOutlineArrowTrendingDown, HiOutlineArrowTrendingUp, HiOutlineFlag, HiOutlinePlus, HiOutlineScale } from "react-icons/hi2";
import { motion, useReducedMotion } from "motion/react";
import { NavLink, Outlet } from "react-router";
import { ProfileMenu } from "@/components/app/profile-menu";
import { CurrencySelect } from "@/components/app/currency-select";
import { PrivacyToggle } from "@/components/app/privacy-toggle";
import { NotificationsPopover } from "@/components/app/notifications-popover";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Coffee } from "@/components/ui/coffee-icon";
import { Logo } from "@/components/ui/logo";
import { Separator } from "@/components/ui/separator";
import { cx } from "@/utils/cx";

const navItems = [
    { label: "Dashboard", to: "/" },
    { label: "Accounts", to: "/accounts" },
];

/** Ordered by how often they get used: daily actions first, setup last. */
const recordActions = [
    { id: "balance", label: "Update balance", icon: HiOutlineScale },
    { id: "expense", label: "Add expense", icon: HiOutlineArrowTrendingDown },
    { id: "income", label: "Add income", icon: HiOutlineArrowTrendingUp },
];

const recordSetup = [
    { id: "commitment", label: "Add recurring bill", icon: HiOutlineArrowPath },
    { id: "goal", label: "New savings goal", icon: HiOutlineFlag },
];

const BUY_ME_A_COFFEE_URL = "https://buymeacoffee.com/margin";

/**
 * The top bar and the mobile bottom bar both render this, so each needs its own
 * `layoutId` — a shared one would make Motion try to tween between a visible
 * element and a `display:none` one, which reads as a jump.
 */
const NavLinks = ({ layoutId }: { layoutId: string }) => {
    const reduceMotion = useReducedMotion();

    return (
        <>
            {navItems.map((item) => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    className="relative flex h-11 items-center rounded-full px-5 text-base font-medium whitespace-nowrap md:h-9 md:px-4 md:text-sm"
                >
                    {({ isActive }) => (
                        <>
                            {isActive && (
                                <motion.span
                                    layoutId={layoutId}
                                    className="absolute inset-0 rounded-full bg-brand-primary"
                                    transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 32 }}
                                />
                            )}
                            <span className={cx("relative z-10", isActive ? "text-brand-secondary" : "text-tertiary")}>{item.label}</span>
                        </>
                    )}
                </NavLink>
            ))}
        </>
    );
};

export const AppLayout = () => {

    return (
        <div className="min-h-screen overflow-x-clip bg-secondary">
            <header className="mx-auto flex w-full max-w-[88rem] items-center justify-between gap-2 px-4 py-4 md:px-8 md:py-5">
                <NavLink to="/" aria-label="Margin — home" className="rounded-md outline-brand focus-visible:outline-2 focus-visible:outline-offset-4">
                    {/* The wordmark is ~117px wide at this height — too much of a
                        393px viewport once the controls are laid out beside it. */}
                    <Logo variant="mark" className="h-9 sm:hidden" />
                    <Logo className="hidden h-7 sm:block" />
                </NavLink>

                <div className="flex min-w-0 shrink items-center gap-1.5 sm:gap-2">
                    <PrivacyToggle />

                    <Dropdown.Root>
                        <Button
                            color="primary"
                            size="sm"
                            iconLeading={HiOutlinePlus}
                            aria-label="Record"
                            className="h-11 rounded-full text-base font-medium max-sm:w-11 max-sm:gap-0 max-sm:px-0 max-sm:*:data-text:hidden sm:px-4 md:h-9 md:text-sm"
                        >
                            Record
                        </Button>

                        <Dropdown.Popover placement="bottom right">
                            <Dropdown.Menu>
                                {recordActions.map((type) => (
                                    <Dropdown.Item key={type.id} id={type.id} label={type.label} icon={type.icon} />
                                ))}

                                <Dropdown.Separator />

                                {recordSetup.map((type) => (
                                    <Dropdown.Item key={type.id} id={type.id} label={type.label} icon={type.icon} />
                                ))}
                            </Dropdown.Menu>
                        </Dropdown.Popover>
                    </Dropdown.Root>

                    <div className="flex h-13 items-center gap-1 rounded-full bg-primary p-1 shadow-xs md:h-11">
                        <div className="hidden items-center gap-1 md:flex">
                            <NavLinks layoutId="nav-pill-top" />
                            <Separator className="mx-1.5" />
                        </div>

                        <Button
                            href={BUY_ME_A_COFFEE_URL}
                            target="_blank"
                            rel="noreferrer"
                            color="tertiary"
                            size="sm"
                            iconLeading={Coffee}
                            className="hidden h-9 rounded-full lg:flex"
                        >
                            Buy me a coffee
                        </Button>

                        <Separator className="mx-1.5 hidden lg:block" />

                        <CurrencySelect />

                        <NotificationsPopover />
                        <ProfileMenu />
                    </div>
                </div>
            </header>

            <main className="mx-auto w-full max-w-[88rem] px-4 pb-28 md:px-8 md:pb-16">
                <Outlet />
            </main>

            <nav
                aria-label="Primary"
                className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden"
            >
                <div className="pointer-events-auto flex h-13 items-center gap-1 rounded-full bg-popover p-1 shadow-[0_4px_12px_rgba(0,0,0,0.10),0_16px_32px_-12px_rgba(0,0,0,0.22)] ring-1 ring-popover">
                    <NavLinks layoutId="nav-pill-bottom" />
                </div>
            </nav>
        </div>
    );
};
