import { getDayOfWeek, getLocalTimeZone, isToday, today } from "@internationalized/date";
import { useControlledState } from "@react-stately/utils";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "@untitledui/icons";
import { Fragment, useState } from "react";
import type { PropsWithChildren, ReactNode } from "react";
import { useDateFormatter } from "react-aria";
import { Calendar as AriaCalendar, CalendarCell as AriaCalendarCell, CalendarContext as AriaCalendarContext, CalendarGrid as AriaCalendarGrid, CalendarGridBody as AriaCalendarGridBody, CalendarGridHeader as AriaCalendarGridHeader, CalendarHeaderCell as AriaCalendarHeaderCell, DatePicker as AriaDatePicker, Dialog as AriaDialog, Group as AriaGroup, Heading as AriaHeading, Popover as AriaPopover, RangeCalendarContext, useLocale, useSlottedContext } from "react-aria-components";
import type { CalendarCellProps as AriaCalendarCellProps, CalendarProps as AriaCalendarProps, DatePickerProps as AriaDatePickerProps, DateValue } from "react-aria-components";
import { Button, type ButtonProps } from "@/components/base/button";
import { InputDateBase } from "@/components/base/input";
import { cx } from "@/utils";

/* ── cell.tsx ── */

interface CalendarCellProps extends AriaCalendarCellProps {
    /** Whether the calendar is a range calendar. */
    isRangeCalendar?: boolean;
    /** Whether the cell is highlighted. */
    isHighlighted?: boolean;
    /** Whether to show out of range dates. */
    showOutOfRangeDates?: boolean;
}

export const CalendarCell = ({ date, isHighlighted, showOutOfRangeDates = false, ...props }: CalendarCellProps) => {
    const { locale } = useLocale();
    const dayOfWeek = getDayOfWeek(date, locale);
    const rangeCalendarContext = useSlottedContext(RangeCalendarContext);

    const isRangeCalendar = !!rangeCalendarContext;

    const start = rangeCalendarContext?.value?.start;
    const end = rangeCalendarContext?.value?.end;

    const isAfterStart = start ? date.compare(start) > 0 : true;
    const isBeforeEnd = end ? date.compare(end) < 0 : true;

    const isAfterOrOnStart = start && date.compare(start) >= 0;
    const isBeforeOrOnEnd = end && date.compare(end) <= 0;
    const isInRange = isAfterOrOnStart && isBeforeOrOnEnd;

    const lastDayOfMonth = new Date(date.year, date.month, 0).getDate();
    const isLastDayOfMonth = date.day === lastDayOfMonth;
    const isFirstDayOfMonth = date.day === 1;

    const isTodayDate = isToday(date, getLocalTimeZone());

    return (
        <AriaCalendarCell
            {...props}
            date={date}
            className={({ isDisabled, isFocusVisible, isSelectionStart, isSelectionEnd, isSelected, isOutsideMonth }) => {
                const isRoundedLeft = isSelectionStart || dayOfWeek === 0;
                const isRoundedRight = isSelectionEnd || dayOfWeek === 6;

                return cx(
                    "relative size-10 focus:outline-hidden",
                    isRoundedLeft && "rounded-l-full",
                    isRoundedRight && "rounded-r-full",
                    isInRange && isDisabled && "bg-secondary",
                    isSelected && isRangeCalendar && "bg-secondary",
                    isDisabled ? "pointer-events-none" : "cursor-pointer",
                    isFocusVisible ? "z-10" : "z-0",
                    isOutsideMonth && "opacity-50",
                    isRangeCalendar && isOutsideMonth && !showOutOfRangeDates && "hidden",

                    // Show gradient on last day of month if it's within the selected range.
                    isLastDayOfMonth &&
                        isSelected &&
                        isBeforeEnd &&
                        isRangeCalendar &&
                        "after:absolute after:inset-0 after:translate-x-full after:bg-gradient-to-l after:from-transparent after:to-bg-secondary in-[[role=gridcell]:last-child]:after:hidden",

                    // Show gradient on first day of month if it's within the selected range.
                    isFirstDayOfMonth &&
                        isSelected &&
                        isAfterStart &&
                        isRangeCalendar &&
                        "after:absolute after:inset-0 after:-translate-x-full after:bg-gradient-to-r after:from-transparent after:to-bg-secondary in-[[role=gridcell]:first-child]:after:hidden",
                );
            }}
        >
            {({ isDisabled, isFocusVisible, isSelectionStart, isSelectionEnd, isSelected, formattedDate }) => {
                const markedAsSelected = isSelectionStart || isSelectionEnd || (isSelected && !isDisabled && !isRangeCalendar);

                return (
                    <div
                        className={cx(
                            "relative flex size-full items-center justify-center rounded-full text-sm text-secondary hover:text-secondary_hover",
                            // Disabled state.
                            isDisabled && "text-secondary/50",
                            // Focus ring, visible while the cell has keyboard focus.
                            isFocusVisible ? "outline-2 outline-offset-2 outline-focus-ring" : "",
                            // Hover state for cells in the middle of the range.
                            isSelected && !isDisabled && isRangeCalendar ? "font-medium" : "",
                            markedAsSelected && "bg-brand-solid font-medium text-white hover:bg-brand-solid_hover hover:text-white",
                            // Hover state for non-selected cells.
                            !isSelected && !isDisabled ? "hover:bg-primary_hover hover:font-medium!" : "",
                            !isSelected && isTodayDate ? "bg-secondary font-medium hover:bg-secondary_hover" : "",
                        )}
                    >
                        {formattedDate}

                        {(isHighlighted || isTodayDate) && (
                            <div
                                className={cx(
                                    "absolute bottom-1 left-1/2 size-1.25 -translate-x-1/2 rounded-full",
                                    markedAsSelected ? "bg-fg-white" : "bg-fg-brand-primary",
                                    isDisabled && "opacity-50",
                                )}
                            />
                        )}
                    </div>
                );
            }}
        </AriaCalendarCell>
    );
};

/* ── calendar.tsx ── */

export const CalendarContextProvider = ({ children }: PropsWithChildren) => {
    const [value, setValue] = useState<DateValue | null>(null);
    const [focusedValue, onFocusChange] = useState<DateValue | undefined>();

    // React Aria's Calendar context widened `onChange` to support multiple selection
    // (`selectionMode="multiple"`). This calendar is single-select, so collapse any
    // array value down to the first entry.
    const onChange = (next: DateValue | readonly DateValue[] | null) => {
        setValue(Array.isArray(next) ? (next[0] ?? null) : next);
    };

    return <AriaCalendarContext.Provider value={{ value, onChange, focusedValue, onFocusChange }}>{children}</AriaCalendarContext.Provider>;
};

interface CalendarProps extends AriaCalendarProps<DateValue> {
    /** The dates to highlight. */
    highlightedDates?: DateValue[];
    /**
     * The content to render between the header and the calendar grid.
     * If not provided, a default layout will be rendered with a date input and a today button.
     */
    children?: ReactNode;
}

export const Calendar = ({ highlightedDates, className, children, ...props }: CalendarProps) => {
    const context = useSlottedContext(AriaCalendarContext);

    const ContextWrapper = context ? Fragment : CalendarContextProvider;

    return (
        <ContextWrapper>
            <AriaCalendar {...props} className={(state) => cx("flex flex-col gap-3", typeof className === "function" ? className(state) : className)}>
                {({ state }) => (
                    <>
                        <header className="flex items-center justify-between">
                            <Button slot="previous" iconLeading={ChevronLeft} size="sm" color="tertiary" className="size-8" />
                            <AriaHeading className="text-sm font-semibold text-fg-secondary" />
                            <Button slot="next" iconLeading={ChevronRight} size="sm" color="tertiary" className="size-8" />
                        </header>

                        {children || (
                            <div className="flex gap-3">
                                <InputDateBase aria-label="Date" size="sm" className="flex-1" />
                                <Button
                                    slot={null}
                                    size="sm"
                                    color="secondary"
                                    onClick={() => {
                                        state.setValue(today(getLocalTimeZone()));
                                        state.setFocusedDate(today(getLocalTimeZone()));
                                    }}
                                >
                                    Today
                                </Button>
                            </div>
                        )}

                        <AriaCalendarGrid weekdayStyle="short" className="w-max">
                            <AriaCalendarGridHeader className="border-b-4 border-transparent">
                                {(day) => (
                                    <AriaCalendarHeaderCell className="p-0">
                                        <div className="flex size-10 items-center justify-center text-sm font-medium text-secondary">{day.slice(0, 2)}</div>
                                    </AriaCalendarHeaderCell>
                                )}
                            </AriaCalendarGridHeader>
                            <AriaCalendarGridBody className="[&_td]:p-0 [&_tr]:border-b-4 [&_tr]:border-transparent [&_tr:last-of-type]:border-none">
                                {(date) => (
                                    <CalendarCell
                                        date={date}
                                        isHighlighted={highlightedDates?.some((highlightedDate) => date.compare(highlightedDate) === 0)}
                                    />
                                )}
                            </AriaCalendarGridBody>
                        </AriaCalendarGrid>
                    </>
                )}
            </AriaCalendar>
        </ContextWrapper>
    );
};

/* ── date-picker.tsx ── */

const highlightedDates = [today(getLocalTimeZone())];

interface DatePickerProps extends AriaDatePickerProps<DateValue> {
    /** The function to call when the apply button is clicked. */
    onApply?: () => void;
    /** The function to call when the cancel button is clicked. */
    onCancel?: () => void;
    /** Controls the size of the trigger button that opens the calendar. */
    size?: ButtonProps["size"];
}

export const DatePicker = ({ value: valueProp, defaultValue, onChange, onApply, onCancel, size = "sm", ...props }: DatePickerProps) => {
    const formatter = useDateFormatter({
        month: "short",
        day: "numeric",
        year: "numeric",
    });
    const [value, setValue] = useControlledState(valueProp, defaultValue || null, onChange);

    const formattedDate = value ? formatter.format(value.toDate(getLocalTimeZone())) : "Select date";

    return (
        <AriaDatePicker aria-label="Date picker" shouldCloseOnSelect={false} {...props} value={value} onChange={setValue}>
            <AriaGroup className="w-full">
                <Button size={size} color="secondary" iconLeading={CalendarIcon} className="w-full justify-start rounded-2xl bg-secondary px-4 py-3 shadow-none">
                    {formattedDate}
                </Button>
            </AriaGroup>
            <AriaPopover
                offset={8}
                placement="bottom right"
                className={({ isEntering, isExiting }) =>
                    cx(
                        "origin-(--trigger-anchor-point) will-change-transform",
                        isEntering &&
                            "duration-150 ease-out animate-in fade-in placement-right:slide-in-from-left-0.5 placement-top:slide-in-from-bottom-0.5 placement-bottom:slide-in-from-top-0.5",
                        isExiting &&
                            "duration-100 ease-in animate-out fade-out placement-right:slide-out-to-left-0.5 placement-top:slide-out-to-bottom-0.5 placement-bottom:slide-out-to-top-0.5",
                    )
                }
            >
                <AriaDialog aria-label="Date picker" className="rounded-3xl bg-popover shadow-xl ring-1 ring-popover">
                    {({ close }) => (
                        <>
                            <div className="flex px-6 py-5">
                                <Calendar highlightedDates={highlightedDates} />
                            </div>
                            <div className="grid grid-cols-2 gap-3 border-t border-secondary p-4">
                                <Button
                                    size="md"
                                    color="secondary"
                                    onClick={() => {
                                        onCancel?.();
                                        close();
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="md"
                                    color="primary"
                                    onClick={() => {
                                        onApply?.();
                                        close();
                                    }}
                                >
                                    Apply
                                </Button>
                            </div>
                        </>
                    )}
                </AriaDialog>
            </AriaPopover>
        </AriaDatePicker>
    );
};
