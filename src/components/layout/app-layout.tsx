import { HiOutlineArrowPath, HiOutlineArrowTrendingDown, HiOutlineArrowTrendingUp, HiOutlineFlag, HiOutlinePlus, HiOutlineScale } from "react-icons/hi2";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { NavLink, Outlet, useLocation } from "react-router";
import { AccountPopover } from "@/components/application/account/account-popover";
import { NotificationsPopover } from "@/components/application/notifications/notifications-popover";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Coffee } from "@/components/foundations/icons/coffee";
import { Logo } from "@/components/foundations/logo/logo";
import { Separator } from "@/components/foundations/separator";
import { cx } from "@/utils/cx";

const navItems = [
    { label: "Dashboard", to: "/" },
    { label: "Accounts", to: "/accounts" },
];

const recordTypes = [
    { id: "balance", label: "Update balance", icon: HiOutlineScale },
    { id: "expense", label: "Add expense", icon: HiOutlineArrowTrendingDown },
    { id: "income", label: "Add income", icon: HiOutlineArrowTrendingUp },
    { id: "commitment", label: "Add commitment", icon: HiOutlineArrowPath },
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
    const location = useLocation();
    const reduceMotion = useReducedMotion();

    return (
        <div className="min-h-screen bg-secondary">
            <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-4 py-4 md:px-8 md:py-5">
                <NavLink to="/" aria-label="Margin — home" className="rounded-md outline-brand focus-visible:outline-2 focus-visible:outline-offset-4">
                    <Logo className="h-9 md:h-7" />
                </NavLink>

                <div className="flex items-center gap-2">
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
                                {recordTypes.map((type) => (
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

                        <NotificationsPopover />
                        <AccountPopover />
                    </div>
                </div>
            </header>

            <main className="mx-auto w-full max-w-7xl px-4 pb-28 md:px-8 md:pb-16">
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={location.pathname}
                        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                    >
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </main>

            <nav
                aria-label="Primary"
                className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden"
            >
                <div className="pointer-events-auto flex h-13 items-center gap-1 rounded-full bg-primary p-1 shadow-xl">
                    <NavLinks layoutId="nav-pill-bottom" />
                </div>
            </nav>
        </div>
    );
};
