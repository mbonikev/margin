import { AnimatePresence, motion } from "motion/react";
import { NavLink, Outlet, useLocation } from "react-router";
import { cx } from "@/utils/cx";

const navItems = [
    { label: "Dashboard", to: "/" },
    { label: "Accounts", to: "/accounts" },
];

export const AppLayout = () => {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-secondary">
            <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 md:px-8">
                <span className="text-lg font-semibold tracking-tight text-primary">Margin</span>

                <nav className="flex items-center gap-1 rounded-full bg-primary p-1 shadow-xs">
                    {navItems.map((item) => (
                        <NavLink key={item.to} to={item.to} end={item.to === "/"} className="relative rounded-full px-4 py-2 text-sm font-medium outline-brand focus-visible:outline-2">
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
                </nav>
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
