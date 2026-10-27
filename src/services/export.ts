/**
 * Workbook export (Issues.txt #13).
 *
 * A spreadsheet rather than the JSON this replaced: the point of exporting is
 * that somebody can open it, and nobody opens a JSON file. One sheet per thing,
 * with real dates and real numbers so Excel can sum and sort them — amounts are
 * written as numbers with a currency format, never as pre-formatted strings.
 */

import { listAccounts } from "@/services/accounts";
import { listActivity } from "@/services/entries";
import { listGoals } from "@/services/goals";
import { listCommitments } from "@/services/commitments";
import type { Worksheet } from "exceljs";

/** Whole-RWF display, matching the base currency's lack of a sub-unit. */
const MONEY = '#,##0" RWF"';
const DATE = "yyyy-mm-dd";

const styleHeader = (sheet: Worksheet) => {
    const header = sheet.getRow(1);
    header.font = { bold: true };
    header.alignment = { vertical: "middle" };
    // Keeps the header visible when the sheet is longer than the window.
    sheet.views = [{ state: "frozen", ySplit: 1 }];
};

export const exportWorkbook = async (): Promise<Blob> => {
    // Loaded on demand: ExcelJS is about a megabyte, and most sessions never
    // export anything. Keeping it out of the entry chunk costs one await here.
    const { default: ExcelJS } = await import("exceljs");

    // One round trip each, in parallel — the export is a snapshot of all of it
    // at roughly the same moment.
    const [accounts, activity, goals, commitments] = await Promise.all([
        listAccounts(),
        // Everything, not just the dashboard's recent slice.
        listActivity(10_000),
        listGoals(),
        listCommitments(),
    ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Margin";
    workbook.created = new Date();

    const accountsSheet = workbook.addWorksheet("Accounts");
    accountsSheet.columns = [
        { header: "Name", key: "name", width: 24 },
        { header: "Kind", key: "kind", width: 16 },
        { header: "Reference", key: "ref", width: 18 },
        { header: "Balance", key: "balance", width: 16, style: { numFmt: MONEY } },
        { header: "Last updated", key: "updated", width: 18 },
    ];
    accounts.forEach((account) => accountsSheet.addRow(account));
    styleHeader(accountsSheet);

    const activitySheet = workbook.addWorksheet("Activity");
    activitySheet.columns = [
        { header: "Date", key: "at", width: 14, style: { numFmt: DATE } },
        { header: "Type", key: "kind", width: 12 },
        { header: "Description", key: "name", width: 28 },
        { header: "Account", key: "account", width: 20 },
        { header: "Amount", key: "amount", width: 16, style: { numFmt: MONEY } },
        { header: "Balance after", key: "balanceAfter", width: 16, style: { numFmt: MONEY } },
        { header: "Note", key: "note", width: 36 },
    ];
    activity.forEach((item) => activitySheet.addRow(item));
    styleHeader(activitySheet);

    const goalsSheet = workbook.addWorksheet("Goals");
    goalsSheet.columns = [
        { header: "Goal", key: "name", width: 24 },
        { header: "Saved", key: "saved", width: 16, style: { numFmt: MONEY } },
        { header: "Target", key: "target", width: 16, style: { numFmt: MONEY } },
        { header: "Progress", key: "progress", width: 12, style: { numFmt: "0%" } },
        { header: "Started", key: "startedAt", width: 14, style: { numFmt: DATE } },
    ];
    goals.forEach((goal) => goalsSheet.addRow({ ...goal, progress: goal.target ? goal.saved / goal.target : 0 }));
    styleHeader(goalsSheet);

    const billsSheet = workbook.addWorksheet("Upcoming");
    billsSheet.columns = [
        { header: "Name", key: "name", width: 24 },
        { header: "Amount", key: "amount", width: 16, style: { numFmt: MONEY } },
        { header: "Due", key: "due", width: 14, style: { numFmt: DATE } },
        { header: "Pressure", key: "pressure", width: 12 },
    ];
    commitments.forEach((bill) => billsSheet.addRow(bill));
    styleHeader(billsSheet);

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
};

/** Hands the workbook to the browser as a download. */
export const downloadWorkbook = async (): Promise<void> => {
    const blob = await exportWorkbook();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `margin-${new Date().toISOString().slice(0, 10)}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
};
