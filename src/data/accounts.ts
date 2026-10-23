import type { Account } from "@/components/app/account-card";

/** Placeholder accounts — shared so the header and the dashboard agree. */
export const accounts: Account[] = [
    { id: "momo", name: "MTN MoMo", kind: "Mobile money", balance: 684000, updated: "Updated today", theme: "blue" },
    { id: "equity", name: "Equity Bank", kind: "Current", balance: 612000, updated: "Updated 2d ago", theme: "graphite" },
    { id: "savings", name: "Laptop fund", kind: "Savings", balance: 168000, updated: "Updated 5d ago", theme: "emerald" },
    { id: "cash", name: "Cash", kind: "Wallet", balance: 4000, updated: "Updated today", theme: "plum" },
];
