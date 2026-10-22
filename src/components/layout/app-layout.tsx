import { Button as AriaButton } from "react-aria-components";
import {
    HiOutlineArrowDownRight,
    HiOutlineArrowPath,
    HiOutlineArrowRightOnRectangle,
    HiOutlineArrowUpRight,
    HiOutlineCog6Tooth,
    HiOutlineEnvelope,
    HiOutlineFlag,
    HiOutlinePlus,
    HiOutlineScale,
    HiOutlineUser,
} from "react-icons/hi2";
import { AnimatePresence, motion } from "motion/react";
import { NavLink, Outlet, useLocation } from "react-router";
import { NotificationsPopover } from "@/components/application/notifications/notifications-popover";
import { Avatar } from "@/components/base/avatar/avatar";
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
    { id: "expense", label: "Add expense", icon: HiOutlineArrowDownRight },
    { id: "income", label: "Add income", icon: HiOutlineArrowUpRight },
    { id: "commitment", label: "Add commitment", icon: HiOutlineArrowPath },
    { id: "goal", label: "New savings goal", icon: HiOutlineFlag },
];

const accountItems = [
    { id: "profile", label: "View profile", icon: HiOutlineUser },
    { id: "settings", label: "Settings", icon: HiOutlineCog6Tooth },
    { id: "morning-email", label: "Morning email", icon: HiOutlineEnvelope },
];

const BUY_ME_A_COFFEE_URL = "https://buymeacoffee.com/margin";

export const AppLayout = () => {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-secondary">
            <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-5 md:px-8">
                <NavLink to="/" aria-label="Margin — home" className="rounded-md outline-brand focus-visible:outline-2 focus-visible:outline-offset-4">
                    <Logo className="h-7" />
                </NavLink>

                <div className="flex items-center gap-2">
                    <Dropdown.Root>
                        <Button color="primary" size="sm" iconLeading={HiOutlinePlus} className="h-9 rounded-full px-4 text-sm font-medium">
                            Record
                        </Button>

                        <Dropdown.Popover placement="bottom left">
                            <Dropdown.Menu>
                                {recordTypes.map((type) => (
                                    <Dropdown.Item key={type.id} id={type.id} label={type.label} icon={type.icon} />
                                ))}
                            </Dropdown.Menu>
                        </Dropdown.Popover>
                    </Dropdown.Root>

                    <div className="flex h-11 items-center gap-1 rounded-full bg-primary p-1 shadow-xs">
                        {navItems.map((item) => (
                            <NavLink key={item.to} to={item.to} end={item.to === "/"} className="relative rounded-full px-4 py-2 text-sm font-medium">
                                {({ isActive }) => (
                                    <>
                                        {isActive && (
                                            <motion.span
                                                layoutId="nav-pill"
                                                className="absolute inset-0 rounded-full bg-brand-primary"
                                                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                                            />
                                        )}
                                        <span className={cx("relative z-10", isActive ? "text-brand-secondary" : "text-tertiary")}>{item.label}</span>
                                    </>
                                )}
                            </NavLink>
                        ))}

                        <Separator className="mx-1.5" />

                        <Button
                            href={BUY_ME_A_COFFEE_URL}
                            target="_blank"
                            rel="noreferrer"
                            color="tertiary"
                            size="sm"
                            iconLeading={Coffee}
                            className="hidden h-9 rounded-full sm:flex"
                        >
                            Buy me a coffee
                        </Button>

                        <Separator className="mx-1.5" />

                        <NotificationsPopover />

                        <Dropdown.Root>
                            <AriaButton aria-label="Account menu" className="group ml-1.5 rounded-full outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2">
                                <Avatar size="sm" initials="K" alt="Your account" className="size-9" focusable />
                            </AriaButton>

                            <Dropdown.Popover placement="bottom right">
                                <Dropdown.Menu>
                                    {accountItems.map((item) => (
                                        <Dropdown.Item key={item.id} id={item.id} label={item.label} icon={item.icon} />
                                    ))}
                                    <Dropdown.Separator />
                                    <Dropdown.Item id="sign-out" label="Sign out" icon={HiOutlineArrowRightOnRectangle} />
                                </Dropdown.Menu>
                            </Dropdown.Popover>
                        </Dropdown.Root>
                    </div>
                </div>
            </header>

            <main className="mx-auto w-full max-w-7xl px-4 pb-16 md:px-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};
