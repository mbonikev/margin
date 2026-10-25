import { Check, ChevronDown, SearchLg } from "@untitledui/icons";
import { createContext, isValidElement, useCallback, useContext, useRef, useState } from "react";
import type { FC, FocusEventHandler, PointerEventHandler, ReactNode, Ref, RefAttributes } from "react";
import { Button as AriaButton, ComboBox as AriaComboBox, ComboBoxStateContext, Group as AriaGroup, Input as AriaInput, ListBox as AriaListBox, ListBoxItem as AriaListBoxItem, Popover as AriaPopover, Select as AriaSelect, SelectValue as AriaSelectValue, Text as AriaText } from "react-aria-components";
import type { ComboBoxProps as AriaComboBoxProps, GroupProps as AriaGroupProps, ListBoxItemProps as AriaListBoxItemProps, ListBoxProps as AriaListBoxProps, PopoverProps as AriaPopoverProps, SelectProps as AriaSelectProps } from "react-aria-components";
import { Avatar } from "@/components/base/avatar";
import { CheckboxBase } from "@/components/base/checkbox";
import { HintText } from "@/components/base/input";
import { Label } from "@/components/base/input";
import { useResizeObserver } from "@/utils";
import { cx } from "@/utils";
import { isReactComponent } from "@/utils";

/* ── select-shared.tsx ── */

export type SelectItemType = {
    /** Unique identifier for the item. */
    id: string | number;
    /** The primary display text. */
    label?: string;
    /** Avatar image URL. */
    avatarUrl?: string;
    /** Whether the item is disabled. */
    isDisabled?: boolean;
    /** Secondary text displayed alongside the label. */
    supportingText?: string;
    /** Leading icon component or element. */
    icon?: FC | ReactNode;
};

export interface CommonProps {
    /** Helper text displayed below the input. */
    hint?: string;
    /** Field label displayed above the input. */
    label?: string;
    /** Tooltip text for the help icon next to the label. */
    tooltip?: string;
    /**
     * The size of the component.
     * @default "md"
     */
    size?: "sm" | "md" | "lg";
    /** Placeholder text when no value is selected. */
    placeholder?: string;
    /** Whether to hide the required indicator from the label. */
    hideRequiredIndicator?: boolean;
}

export const sizes = {
    sm: {
        root: "py-2 pl-3 pr-2.5 gap-2 *:data-icon:size-4 *:data-icon:stroke-[2.25px]",
        withIcon: "",
        text: "text-sm",
        textContainer: "gap-x-1.5",
        shortcut: "pr-2.5",
    },
    md: { root: "py-2 px-3 gap-2 *:data-icon:size-5", withIcon: "", text: "text-md", textContainer: "gap-x-1.5", shortcut: "pr-2.5" },
    lg: { root: "py-2.5 px-3.5 gap-2 *:data-icon:size-5", withIcon: "", text: "text-md", textContainer: "gap-x-1.5", shortcut: "pr-3" },
};

export const SelectContext = createContext<{ size: "sm" | "md" | "lg" }>({ size: "md" });

/* ── popover.tsx ── */

interface PopoverProps extends AriaPopoverProps, RefAttributes<HTMLElement> {
    /** Caps how tall the popover can grow before its list starts scrolling: 14rem for `sm`, 16rem for `md`, and 20rem for `lg`. */
    size: "sm" | "md" | "lg";
}

export const Popover = (props: PopoverProps) => {
    return (
        <AriaPopover
            placement="bottom"
            containerPadding={0}
            offset={4}
            {...props}
            className={(state) =>
                cx(
                    "w-(--trigger-width) origin-(--trigger-anchor-point) overflow-x-hidden overflow-y-auto rounded-2xl bg-popover p-1 shadow-xl ring-1 ring-popover outline-hidden will-change-transform",

                    state.isEntering &&
                        "duration-150 ease-out animate-in fade-in placement-right:slide-in-from-left-0.5 placement-top:slide-in-from-bottom-0.5 placement-bottom:slide-in-from-top-0.5",
                    state.isExiting &&
                        "duration-100 ease-in animate-out fade-out placement-right:slide-out-to-left-0.5 placement-top:slide-out-to-bottom-0.5 placement-bottom:slide-out-to-top-0.5",

                    props.size === "sm" && "max-h-56!",
                    props.size === "md" && "max-h-64!",
                    props.size === "lg" && "max-h-80!",

                    typeof props.className === "function" ? props.className(state) : props.className,
                )
            }
        />
    );
};

/* ── select-item.tsx ── */

const itemSizes = {
    sm: {
        root: "p-2 pr-2.5 gap-2 *:data-icon:size-4 *:data-icon:stroke-[2.25px]",
        text: "text-sm",
        textContainer: "gap-x-1.5",
        check: "size-4 stroke-[2.25px]",
        checkbox: "sm" as const,
    },
    md: {
        root: "p-2 pr-2.5 gap-2 *:data-icon:size-5",
        text: "text-md",
        textContainer: "gap-x-2",
        check: "size-5",
        checkbox: "sm" as const,
    },
    lg: {
        root: "p-2.5 pl-2 gap-2 *:data-icon:size-5",
        text: "text-md",
        textContainer: "gap-x-2",
        check: "size-5",
        checkbox: "md" as const,
    },
};

interface SelectItemProps extends Omit<AriaListBoxItemProps<SelectItemType>, "id">, SelectItemType {
    /** The selection indicator to be displayed on the item. */
    selectionIndicator?: "checkmark" | "checkbox" | "none";
    /** The alignment of the selection indicator. */
    selectionIndicatorAlign?: "left" | "right";
}

export const SelectItem = ({
    label,
    id,
    value,
    avatarUrl,
    supportingText,
    isDisabled,
    icon: Icon,
    className,
    children,
    selectionIndicator = "checkmark",
    selectionIndicatorAlign = "right",
    ...props
}: SelectItemProps) => {
    const { size } = useContext(SelectContext);

    const labelOrChildren = label || (typeof children === "string" ? children : "");
    const textValue = supportingText ? labelOrChildren + " " + supportingText : labelOrChildren;

    const isLeft = selectionIndicatorAlign === "left";

    return (
        <AriaListBoxItem
            id={id}
            value={
                value ?? {
                    id,
                    label: labelOrChildren,
                    avatarUrl,
                    supportingText,
                    isDisabled,
                    icon: Icon,
                }
            }
            textValue={textValue}
            isDisabled={isDisabled}
            {...props}
            className={(state) =>
                cx("w-full py-px outline-hidden", size === "sm" ? "px-1" : "px-1.5", typeof className === "function" ? className(state) : className)
            }
        >
            {(state) => (
                <div
                    className={cx(
                        "flex cursor-pointer items-center rounded-xl outline-hidden select-none",
                        (state.isFocused || state.isHovered || (state.isSelected && selectionIndicator !== "checkbox")) && "bg-primary_hover",
                        state.isDisabled && "cursor-not-allowed opacity-50",
                        state.isFocusVisible && "ring-2 ring-focus-ring ring-inset",

                        // Icon styles
                        "*:data-icon:shrink-0 *:data-icon:text-fg-quaternary",

                        itemSizes[size].root,
                    )}
                >
                    {isLeft && selectionIndicator === "checkbox" && (
                        <CheckboxBase size={itemSizes[size].checkbox} isSelected={state.isSelected} isDisabled={state.isDisabled} />
                    )}

                    {avatarUrl ? (
                        <Avatar aria-hidden="true" size="xs" src={avatarUrl} alt={label} className={cx(size === "sm" && "size-5")} />
                    ) : isReactComponent(Icon) ? (
                        <Icon data-icon aria-hidden="true" />
                    ) : isValidElement(Icon) ? (
                        Icon
                    ) : null}

                    <div className={cx("flex w-full min-w-0 flex-1 flex-wrap", itemSizes[size].textContainer)}>
                        <AriaText slot="label" className={cx("truncate font-medium whitespace-nowrap text-primary", itemSizes[size].text)}>
                            {label || (typeof children === "function" ? children(state) : children)}
                        </AriaText>

                        {supportingText && (
                            <AriaText slot="description" className={cx("whitespace-nowrap text-tertiary", itemSizes[size].text)}>
                                {supportingText}
                            </AriaText>
                        )}
                    </div>

                    {state.isSelected && selectionIndicator === "checkmark" && (
                        <Check aria-hidden="true" className={cx("ml-auto text-fg-brand-primary", itemSizes[size].check)} />
                    )}

                    {!isLeft && selectionIndicator === "checkbox" && (
                        <CheckboxBase size={itemSizes[size].checkbox} isSelected={state.isSelected} isDisabled={state.isDisabled} className="ml-auto" />
                    )}
                </div>
            )}
        </AriaListBoxItem>
    );
};

/* ── combobox.tsx ── */

interface ComboBoxProps extends Omit<AriaComboBoxProps<SelectItemType>, "children" | "items">, RefAttributes<HTMLDivElement>, CommonProps {
    /** Whether to pin a ⌘K key hint to the right edge of the input. It is hidden below the medium breakpoint. */
    shortcut?: boolean;
    /** The options to render in the dropdown. When `children` is a function it is called once per item to render it. */
    items?: SelectItemType[];
    /** Additional classes merged onto the dropdown popover, which is sized to match the input. */
    popoverClassName?: string;
    /** Additional classes merged onto the ⌘K hint container, useful for adjusting its fade and spacing. */
    shortcutClassName?: string;
    /** Leading icon component displayed before the input. */
    icon?: FC | ReactNode;
    /** The dropdown contents: either `Select.Item` elements, or a render function called with each entry of `items`. */
    children: AriaListBoxProps<SelectItemType>["children"];
}

interface ComboBoxValueProps extends AriaGroupProps {
    /** Controls the field's padding, text size, and icon size. */
    size: "sm" | "md" | "lg";
    /** Whether to pin the ⌘K key hint to the right edge of the field. */
    shortcut: boolean;
    /** Text shown in the input while it is empty. */
    placeholder?: string;
    /** Additional classes merged onto the ⌘K hint container. */
    shortcutClassName?: string;
    /** Leading icon rendered before the input. Falls back to a search icon when omitted. */
    icon?: FC | ReactNode;
    /** Fires when focus moves into the field. Used to re-measure the field so the popover matches its width. */
    onFocus?: FocusEventHandler;
    /** Fires when the pointer enters the field. Used to re-measure the field so the popover matches its width. */
    onPointerEnter?: PointerEventHandler;
    /** Ref to the field wrapper. It anchors the popover and provides the width it is sized to. */
    ref?: Ref<HTMLDivElement>;
}

const ComboBoxValue = ({ size, shortcut, placeholder, shortcutClassName, icon: IconProp, ref, ...otherProps }: ComboBoxValueProps) => {
    const state = useContext(ComboBoxStateContext);

    const value = state?.selectedItem?.value || null;
    const inputValue = state?.inputValue || null;

    const first = inputValue?.split(value?.supportingText)?.[0] || "";
    const last = inputValue?.split(first)[1];

    return (
        <AriaGroup
            ref={ref}
            {...otherProps}
            className={({ isFocusWithin, isDisabled }) =>
                cx(
                    "relative flex w-full items-center gap-2 rounded-2xl bg-secondary outline-hidden transition duration-100 ease-linear",
                    isDisabled && "cursor-not-allowed opacity-50",
                    isFocusWithin && "ring-2 ring-brand",

                    // Icon styles
                    "*:data-icon:shrink-0 *:data-icon:text-fg-quaternary",

                    sizes[size].root,
                )
            }
        >
            {isReactComponent(IconProp) ? (
                <IconProp data-icon className="pointer-events-none" aria-hidden="true" />
            ) : isValidElement(IconProp) ? (
                IconProp
            ) : (
                <SearchLg data-icon className="pointer-events-none" aria-hidden="true" />
            )}

            <div className="relative flex w-full items-center">
                {inputValue && (
                    <span className={cx("absolute top-1/2 z-0 inline-flex w-full -translate-y-1/2 truncate", sizes[size].textContainer)} aria-hidden="true">
                        <p className={cx("font-medium text-primary", sizes[size].text)}>{first}</p>
                        {last && <p className={cx("-ml-0.75 text-tertiary", sizes[size].text)}>{last}</p>}
                    </span>
                )}

                <AriaInput
                    placeholder={placeholder}
                    className={cx(
                        "z-10 w-full appearance-none bg-transparent text-transparent caret-alpha-black/90 placeholder:text-placeholder focus:outline-hidden disabled:cursor-not-allowed",
                        sizes[size].text,
                    )}
                />
            </div>

            {shortcut && (
                <div
                    className={cx(
                        "absolute inset-y-0.5 right-0.5 z-10 hidden items-center rounded-r-[inherit] bg-linear-to-r from-transparent to-bg-primary to-40% pl-8 md:flex",
                        sizes[size].shortcut,
                        shortcutClassName,
                    )}
                >
                    <span
                        className="pointer-events-none rounded px-1 py-px text-xs font-medium text-quaternary ring-1 ring-secondary select-none ring-inset"
                        aria-hidden="true"
                    >
                        ⌘K
                    </span>
                </div>
            )}
        </AriaGroup>
    );
};

export const ComboBox = ({
    placeholder = "Search",
    shortcut = false,
    size = "md",
    children,
    items,
    shortcutClassName,
    icon,
    hideRequiredIndicator,
    ...otherProps
}: ComboBoxProps) => {
    const placeholderRef = useRef<HTMLDivElement>(null);
    const [popoverWidth, setPopoverWidth] = useState("");

    // Resize observer for popover width
    const onResize = useCallback(() => {
        if (!placeholderRef.current) return;

        const divRect = placeholderRef.current?.getBoundingClientRect();

        setPopoverWidth(divRect.width + "px");
    }, [placeholderRef, setPopoverWidth]);

    useResizeObserver({
        ref: placeholderRef,
        box: "border-box",
        onResize,
    });

    return (
        <SelectContext.Provider value={{ size }}>
            <AriaComboBox menuTrigger="focus" {...otherProps}>
                {(state) => (
                    <div className="flex flex-col gap-1.5">
                        {otherProps.label && (
                            <Label isRequired={hideRequiredIndicator ? false : state.isRequired} tooltip={otherProps.tooltip}>
                                {otherProps.label}
                            </Label>
                        )}

                        <ComboBoxValue
                            ref={placeholderRef}
                            placeholder={placeholder}
                            shortcut={shortcut}
                            shortcutClassName={shortcutClassName}
                            icon={icon}
                            size={size}
                            // This is a workaround to correctly calculating the trigger width
                            // while using ResizeObserver wasn't 100% reliable.
                            onFocus={onResize}
                            onPointerEnter={onResize}
                        />

                        <Popover size={size} triggerRef={placeholderRef} style={{ width: popoverWidth }} className={otherProps.popoverClassName}>
                            <AriaListBox items={items} className="size-full outline-hidden">
                                {children}
                            </AriaListBox>
                        </Popover>

                        {otherProps.hint && (
                            <HintText isInvalid={state.isInvalid} className={cx(size === "sm" && "text-xs")}>
                                {otherProps.hint}
                            </HintText>
                        )}
                    </div>
                )}
            </AriaComboBox>
        </SelectContext.Provider>
    );
};

/* ── select.tsx ── */


export interface SelectProps extends Omit<AriaSelectProps<SelectItemType>, "children" | "items">, RefAttributes<HTMLDivElement>, CommonProps {
    /** The options to render in the dropdown. When `children` is a function it is called once per item to render it. */
    items?: SelectItemType[];
    /** Additional classes merged onto the dropdown popover. */
    popoverClassName?: string;
    /** Leading icon shown in the trigger, used as a fallback when the selected item has no icon of its own. Accepts a component reference or a rendered element. */
    icon?: FC | ReactNode;
    /** The dropdown contents: either `Select.Item` elements, or a render function called with each entry of `items`. */
    children: ReactNode | ((item: SelectItemType) => ReactNode);
}

interface SelectValueProps {
    /** Whether the dropdown is open, which keeps the trigger in its focused ring style. */
    isOpen: boolean;
    /** Controls the trigger's padding, text size, and icon size. */
    size: "sm" | "md" | "lg";
    /** Whether the trigger is focused, which draws the brand focus ring. */
    isFocused: boolean;
    /** Whether the trigger is dimmed and rejects pointer interaction. */
    isDisabled: boolean;
    /** Text shown in the trigger while no item is selected. */
    placeholder?: string;
    /** Ref to the trigger button element. */
    ref?: Ref<HTMLButtonElement>;
    /** Leading icon shown in the trigger when the selected item has no icon of its own. */
    icon?: FC | ReactNode;
}

const SelectValue = ({ isOpen, isFocused, isDisabled, size, placeholder, icon, ref }: SelectValueProps) => {
    return (
        <AriaButton
            ref={ref}
            className={cx(
                "relative flex w-full cursor-pointer items-center rounded-2xl bg-secondary outline-hidden transition duration-100 ease-linear",
                (isFocused || isOpen) && "ring-2 ring-brand",
                isDisabled && "cursor-not-allowed opacity-50",
            )}
        >
            <AriaSelectValue<SelectItemType>
                className={(state) =>
                    cx(
                        "flex h-max w-full items-center justify-start truncate text-left align-middle",

                        sizes[size].root,

                        // With icon
                        (state.selectedItems[0]?.icon || icon) && sizes[size].withIcon,

                        // Icon styles
                        "*:data-icon:shrink-0 *:data-icon:text-fg-quaternary",
                    )
                }
            >
                {(state) => {
                    const selectedItem = state.selectedItems[0];
                    const Icon = selectedItem?.icon || icon;

                    return (
                        <>
                            {selectedItem?.avatarUrl ? (
                                <Avatar size="xs" src={selectedItem.avatarUrl} alt={selectedItem.label} className={cx(size === "sm" && "size-5")} />
                            ) : isReactComponent(Icon) ? (
                                <Icon data-icon aria-hidden="true" />
                            ) : isValidElement(Icon) ? (
                                Icon
                            ) : null}

                            {selectedItem ? (
                                <section className={cx("flex w-full truncate", sizes[size].textContainer)}>
                                    <p className={cx("truncate font-medium text-primary", sizes[size].text)}>{selectedItem?.label}</p>
                                    {selectedItem?.supportingText && <p className={cx("text-tertiary", sizes[size].text)}>{selectedItem?.supportingText}</p>}
                                </section>
                            ) : (
                                <p className={cx("text-placeholder", sizes[size].text)}>{placeholder}</p>
                            )}

                            <ChevronDown
                                aria-hidden="true"
                                className={cx("ml-auto shrink-0 text-fg-quaternary", size === "lg" ? "size-5" : "size-4 stroke-[2.25px]")}
                            />
                        </>
                    );
                }}
            </AriaSelectValue>
        </AriaButton>
    );
};

const Select = ({
    placeholder = "Select",
    icon,
    size = "md",
    children,
    items,
    label,
    hint,
    tooltip,
    hideRequiredIndicator,
    className,
    ...rest
}: SelectProps) => {
    return (
        <SelectContext.Provider value={{ size }}>
            <AriaSelect {...rest} className={(state) => cx("flex flex-col gap-1.5", typeof className === "function" ? className(state) : className)}>
                {(state) => (
                    <>
                        {label && (
                            <Label isRequired={hideRequiredIndicator ? false : state.isRequired} tooltip={tooltip}>
                                {label}
                            </Label>
                        )}

                        <SelectValue {...state} {...{ size, placeholder }} icon={icon} />

                        <Popover size={size} className={rest.popoverClassName}>
                            <AriaListBox items={items} className="size-full outline-hidden">
                                {children}
                            </AriaListBox>
                        </Popover>

                        {hint && (
                            <HintText isInvalid={state.isInvalid} className={cx(size === "sm" && "text-xs")}>
                                {hint}
                            </HintText>
                        )}
                    </>
                )}
            </AriaSelect>
        </SelectContext.Provider>
    );
};

const _Select = Select as typeof Select & {
    ComboBox: typeof ComboBox;
    Item: typeof SelectItem;
};
_Select.ComboBox = ComboBox;
_Select.Item = SelectItem;

export { _Select as Select };
