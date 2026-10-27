import { HelpCircle, InfoCircle } from "@untitledui/icons";
import { createContext, useContext } from "react";
import type { ComponentType, HTMLAttributes, ReactNode, Ref } from "react";
import { DateField as AriaDateField, DateInput as AriaDateInput, DateSegment as AriaDateSegment, Group as AriaGroup, Label as AriaLabel, Text as AriaText } from "react-aria-components";
import type { DateFieldProps as AriaDateFieldProps, DateValue, DateInputProps as AriaDateInputProps, LabelProps as AriaLabelProps, TextProps as AriaTextProps } from "react-aria-components";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip";
import { cx, sortCx } from "@/utils";

/* ── label.tsx ── */

interface LabelProps extends AriaLabelProps {
    /** The label text, rendered before the required asterisk and the tooltip trigger. */
    children: ReactNode;
    /** Whether the required asterisk is tinted with the error color. When left undefined, it follows the invalid state of the surrounding field instead. */
    isInvalid?: boolean;
    /** Whether the required asterisk is shown. When left undefined, it appears only if the surrounding field is marked required. */
    isRequired?: boolean;
    /** Title text for a help tooltip. Setting it renders a help icon after the label that stays interactive even when the field is disabled. */
    tooltip?: string;
    /** Supporting text shown under the tooltip title. Only rendered when `tooltip` is set. */
    tooltipDescription?: string;
    /** Ref to the underlying label element. */
    ref?: Ref<HTMLLabelElement>;
}

export const Label = ({ isInvalid, isRequired, tooltip, tooltipDescription, className, ...props }: LabelProps) => {
    return (
        <AriaLabel
            // Used for conditionally hiding/showing the label element via CSS:
            // <Input label="Visible only on mobile" className="lg:**:data-label:hidden" />
            // or
            // <Input label="Visible only on mobile" className="lg:label:hidden" />
            data-label="true"
            {...props}
            className={cx("flex cursor-default items-center gap-0.5 text-sm font-medium text-secondary", className)}
        >
            {props.children}

            <span
                className={cx(
                    "hidden text-brand-tertiary",
                    isRequired && "block",
                    typeof isRequired === "undefined" && "group-required:block",

                    isInvalid && "text-error-primary",
                    typeof isInvalid === "undefined" && "group-invalid:text-error-primary",
                )}
            >
                *
            </span>

            {tooltip && (
                <Tooltip title={tooltip} description={tooltipDescription} placement="top">
                    <TooltipTrigger
                        // `TooltipTrigger` inherits the disabled state from the parent form field
                        // but we don't that. We want the tooltip be enabled even if the parent
                        // field is disabled.
                        isDisabled={false}
                        className="cursor-pointer text-fg-quaternary transition duration-200 hover:text-fg-quaternary_hover focus:text-fg-quaternary_hover"
                    >
                        <HelpCircle className="size-4" />
                    </TooltipTrigger>
                </Tooltip>
            )}
        </AriaLabel>
    );
};

Label.displayName = "Label";

/* ── hint-text.tsx ── */

interface HintTextProps extends AriaTextProps {
    /** Indicates that the hint text is an error message. */
    isInvalid?: boolean;
    /** Ref to the underlying text element. */
    ref?: Ref<HTMLElement>;
    /** Controls the hint's text size; `sm` renders it one step smaller. The text also shrinks automatically inside a small input field. */
    size?: "sm" | "md";
    /** The helper text, or the error message when `isInvalid` is set. */
    children: ReactNode;
}

export const HintText = ({ isInvalid, className, size = "md", ...props }: HintTextProps) => {
    return (
        <AriaText
            {...props}
            slot={isInvalid ? "errorMessage" : "description"}
            className={cx(
                "text-sm text-tertiary",

                // Size
                size === "sm" && "text-xs",
                "in-data-[input-size=sm]:text-xs",

                // Invalid state
                isInvalid && "text-error-primary",
                "group-invalid:text-error-primary",

                className,
            )}
        />
    );
};

HintText.displayName = "HintText";

/* ── input-date.tsx ── */

const DateFieldContext = createContext<{
    size?: "sm" | "md" | "lg";
    wrapperClassName?: string;
    iconClassName?: string;
    tooltipClassName?: string;
    inputClassName?: string;
}>({});

export interface InputDateBaseProps extends Omit<AriaDateInputProps, "children"> {
    /** Tooltip message on hover. */
    tooltip?: string;
    /**
     * Input size.
     * @default "md"
     */
    size?: "sm" | "md" | "lg";
    /** Placeholder text. */
    placeholder?: string;
    /** Class name for the icon. */
    iconClassName?: string;
    /** Class name for the input wrapper. */
    wrapperClassName?: string;
    /** Class name for the tooltip. */
    tooltipClassName?: string;
    /** Keyboard shortcut to display. */
    shortcut?: string | boolean;
    /** Ref for the hidden native input that holds the date value. */
    ref?: Ref<HTMLInputElement>;
    /** Ref for the group element that wraps the date segments, icon and tooltip. */
    groupRef?: Ref<HTMLDivElement>;
    /** Icon component to display on the left side of the input. */
    icon?: ComponentType<HTMLAttributes<HTMLOrSVGElement>>;
    /** Whether the input shows the error state, replacing the tooltip icon with an error icon. */
    isInvalid?: boolean;
    /** Whether the input is dimmed and cannot be edited. */
    isDisabled?: boolean;
}

export const InputDateBase = ({
    tooltip,
    shortcut,
    groupRef,
    size = "md",
    isInvalid,
    isDisabled,
    icon: Icon,
    wrapperClassName,
    tooltipClassName,
    iconClassName,
    ...inputProps
}: Omit<InputDateBaseProps, "label" | "hint">) => {
    // Check if the input has a leading icon or tooltip
    const hasTrailingIcon = tooltip || isInvalid;
    const hasLeadingIcon = Icon;

    // If the input is inside a `TextFieldContext`, use its context to simplify applying styles
    const context = useContext(DateFieldContext);

    const inputSize = context?.size || size;

    const sizes = sortCx({
        sm: {
            root: cx("px-3 py-2 text-sm", hasTrailingIcon && "pr-9", hasLeadingIcon && "pl-8.5"),
            iconLeading: "left-3 size-4 stroke-[2.25px]",
            iconTrailing: "right-3",
            shortcut: "pr-2.5",
        },
        md: {
            root: cx("px-3 py-2 text-md", hasTrailingIcon && "pr-9", hasLeadingIcon && "pl-10"),
            iconLeading: "left-3 size-5",
            iconTrailing: "right-3",
            shortcut: "pr-2.5",
        },
        lg: {
            root: cx("px-3.5 py-2.5 text-md", hasTrailingIcon && "pr-9.5", hasLeadingIcon && "pl-10.5"),
            iconLeading: "left-3.5 size-5",
            iconTrailing: "right-3.5",
            shortcut: "pr-3",
        },
    });

    return (
        <AriaGroup
            {...{ isDisabled, isInvalid }}
            ref={groupRef}
            className={({ isFocusWithin, isDisabled, isInvalid }) =>
                cx(
                    "group/input relative flex w-full flex-row place-content-center place-items-center rounded-full bg-secondary transition duration-100 ease-linear",

                    isFocusWithin && !isDisabled && "ring-2 ring-brand",

                    // Disabled state styles
                    isDisabled && "cursor-not-allowed opacity-50 in-data-input-wrapper:opacity-100",
                    "group-disabled:cursor-not-allowed group-disabled:opacity-50 in-data-input-wrapper:group-disabled:opacity-100",

                    // Invalid state styles
                    isInvalid && "ring-error_subtle",
                    "group-invalid:ring-error_subtle",

                    // Invalid state with focus-within styles
                    isInvalid && isFocusWithin && "ring-2 ring-error",
                    isFocusWithin && "group-invalid:ring-2 group-invalid:ring-error",

                    context?.wrapperClassName,
                    wrapperClassName,
                )
            }
        >
            {/* Leading icon and Payment icon */}
            {Icon && (
                <Icon className={cx("pointer-events-none absolute text-fg-quaternary", sizes[inputSize].iconLeading, context?.iconClassName, iconClassName)} />
            )}

            {/* Input field */}
            <AriaDateInput {...inputProps} className={cx("flex w-full", sizes[size].root, typeof inputProps.className === "string" && inputProps.className)}>
                {(segment) => (
                    <AriaDateSegment
                        segment={segment}
                        className={cx(
                            "rounded px-0.5 text-primary tabular-nums caret-transparent focus:bg-brand-solid focus:font-medium focus:text-white focus:outline-hidden",
                            // The placeholder segment.
                            segment.isPlaceholder && "text-placeholder uppercase",
                            // The separator "/" segment.
                            segment.type === "literal" && "text-fg-quaternary",
                        )}
                    />
                )}
            </AriaDateInput>

            {/* Tooltip and help icon */}
            {tooltip && (
                <Tooltip title={tooltip} placement="top">
                    <TooltipTrigger
                        className={cx(
                            "absolute cursor-pointer text-fg-quaternary transition duration-200 group-invalid/input:hidden hover:text-fg-quaternary_hover focus:text-fg-quaternary_hover",
                            sizes[inputSize].iconTrailing,
                            context?.tooltipClassName,
                            tooltipClassName,
                        )}
                    >
                        <HelpCircle className="size-4 stroke-[2.25px]" />
                    </TooltipTrigger>
                </Tooltip>
            )}

            {/* Invalid icon */}
            <InfoCircle
                className={cx(
                    "pointer-events-none absolute hidden size-4 stroke-[2.25px] text-fg-error-secondary group-invalid/input:block",
                    sizes[inputSize].iconTrailing,
                    context?.tooltipClassName,
                    tooltipClassName,
                )}
            />

            {/* Shortcut */}
            {shortcut && (
                <div
                    className={cx(
                        "pointer-events-none absolute inset-y-0.5 right-0.5 z-10 flex items-center rounded-r-[inherit] bg-linear-to-r from-transparent to-bg-primary to-40% pl-8",
                        sizes[inputSize].shortcut,
                    )}
                >
                    <span
                        aria-hidden="true"
                        className="pointer-events-none rounded px-1 py-px text-xs font-medium text-quaternary ring-1 ring-secondary select-none ring-inset"
                    >
                        {typeof shortcut === "string" ? shortcut : "⌘K"}
                    </span>
                </div>
            )}
        </AriaGroup>
    );
};

interface InputProps
    extends
        AriaDateFieldProps<DateValue>,
        Pick<
            InputDateBaseProps,
            "ref" | "size" | "placeholder" | "icon" | "shortcut" | "tooltip" | "groupRef" | "iconClassName" | "wrapperClassName" | "tooltipClassName"
        > {
    /** Label text for the input */
    label?: string;
    /** Helper text displayed below the input */
    hint?: ReactNode;
    /** Whether to hide required indicator from label */
    hideRequiredIndicator?: boolean;
    /** Class name for the input. */
    inputClassName?: string;
}

export const InputDate = ({
    size = "md",
    placeholder,
    icon: Icon,
    label,
    hint,
    shortcut,
    hideRequiredIndicator,
    className,
    ref,
    groupRef,
    tooltip,
    iconClassName,
    inputClassName,
    wrapperClassName,
    tooltipClassName,
    ...props
}: InputProps) => {
    return (
        <AriaDateField
            {...props}
            className={(state) =>
                cx("group flex h-max w-full flex-col items-start justify-start gap-1.5", typeof className === "function" ? className(state) : className)
            }
        >
            {({ isInvalid, state }) => (
                <>
                    {label && (
                        <Label isRequired={hideRequiredIndicator ? !hideRequiredIndicator : state.isRequired} isInvalid={isInvalid}>
                            {label}
                        </Label>
                    )}

                    <InputDateBase
                        className={inputClassName}
                        {...{
                            ref,
                            groupRef,
                            size,
                            placeholder,
                            icon: Icon,
                            shortcut,
                            iconClassName,
                            wrapperClassName,
                            tooltipClassName,
                            tooltip,
                        }}
                    />

                    {hint && (
                        <HintText isInvalid={isInvalid} className={cx(size === "sm" && "text-xs")}>
                            {hint}
                        </HintText>
                    )}
                </>
            )}
        </AriaDateField>
    );
};
