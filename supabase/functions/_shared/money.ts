/** Formatting for the mail. Amounts are whole RWF, the base currency. */

export const formatRwf = (amount: number): string => `${new Intl.NumberFormat("en-RW").format(amount)} RWF`;

/** Escapes anything user-entered before it goes into the HTML mail body. */
export const escapeHtml = (value: string): string =>
    value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
