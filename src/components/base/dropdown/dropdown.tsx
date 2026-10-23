import { type FC, type RefAttributes, useCallback } from "react";
import { Check, ChevronRight, DotsVertical } from "@untitledui/icons";
import type {
    ButtonProps as AriaButtonProps,
    MenuItemProps as AriaMenuItemProps,
    MenuProps as AriaMenuProps,
    PopoverProps as AriaPopoverProps,
    SeparatorProps as AriaSeparatorProps,
    MenuItemRenderProps,
} from "react-aria-components";
import {
    Button as AriaButton,
    Header as AriaHeader,
    Menu as AriaMenu,
    MenuItem as AriaMenuItem,
    MenuSection as AriaMenuSection,
    MenuTrigger as AriaMenuTrigger,
    Popover as AriaPopover,
    Separator as AriaSeparator,
} from "react-aria-components";
import { cx } from "@/utils/cx";
import { Avatar } from "../avatar/avatar";
import { CheckboxBase } from "../checkbox/checkbox";
import { RadioButtonBase } from "../radio-buttons/radio-buttons";
import { ToggleBase } from "../toggle/toggle";

interface DropdownItemProps extends AriaMenuItemProps {
    /** The label of the item to be displayed. */
    label?: string;
    /** An addon to be displayed on the right side of the item. */
    addon?: string;
    /** If true, the item will not have any styles. */
    unstyled?: boolean;
    /** An icon to be displayed on the left side of the item. */
    icon?: FC<{ className?: string }>;
    /** Avatar URL to be displayed on the left side of the item. */
    avatarUrl?: string;
    /** The selection indicator to be displayed on the item. */
    selectionIndicator?: "checkmark" | "checkbox" | "radio" | "toggle" | "none";
}

const DropdownItem = ({ label, children, addon, icon: Icon, avatarUrl, unstyled, selectionIndicator = "checkmark", ...props }: DropdownItemProps) => {
    const SelectionIndicator = useCallback(
        (state: MenuItemRenderProps & { className?: string }) => {
            if (selectionIndicator === "checkmark") {
                return (
                    <Check
                        aria-hidden="true"
                        className={cx("size-4 shrink-0 stroke-[2.25px] text-fg-brand-primary", !state.isSelected && "invisible", state.className)}
                    />
                );
            }
            if (selectionIndicator === "checkbox") {
                return (
                    <CheckboxBase
                        isSelected={state.isSelected && !state.hasSubmenu}
                        isIndeterminate={state.isSelected && state.hasSubmenu}
                        size="sm"
                        className={cx("shrink-0", state.className)}
                    />
                );
            }
            if (selectionIndicator === "radio") {
                return <RadioButtonBase isSelected={state.isSelected} className={cx("shrink-0", state.className)} />;
            }
            if (selectionIndicator === "toggle") {
                return <ToggleBase slim size="sm" isSelected={state.isSelected} className={cx("shrink-0", state.className)} />;
            }
            return null;
        },
        [selectionIndicator],
    );

    if (unstyled) {
        return <AriaMenuItem id={label} textValue={label} {...props} />;
    }

    return (
        <AriaMenuItem
            {...props}
            className={(state) =>
                cx(
                    "group block cursor-pointer outline-hidden",
                    state.isDisabled && "cursor-not-allowed opacity-50",
                    typeof props.className === "function" ? props.className(state) : props.className,
                )
            }
        >
            {(state) => (
                <div
                    className={cx(
                        "relative flex h-11 items-center rounded-full px-3.5 outline-focus-ring transition duration-100 ease-linear md:h-9",
                        !state.isDisabled && "group-hover:bg-brand-popover",
                        state.isFocused && "bg-brand-popover",
                        state.isFocusVisible && "outline-2 -outline-offset-2",
                        state.hasSubmenu && "pr-1.5",
                    )}
                >
                    {state.selectionMode !== "none" && !avatarUrl && !Icon && <SelectionIndicator {...state} className="mr-2" />}

                    {avatarUrl && (
                        <div className="mr-2 flex size-4 items-center justify-center">
                            <Avatar aria-hidden="true" size="xs" src={avatarUrl} alt={label} className="size-5" />
                        </div>
                    )}

                    {Icon && <Icon aria-hidden="true" className={cx("mr-3 size-5 shrink-0 text-tertiary", state.isFocused && "text-brand-secondary")} />}

                    <span className={cx("grow truncate text-sm font-medium text-tertiary", state.isFocused && "text-brand-secondary")}>
                        {label || (typeof children === "function" ? children(state) : children)}
                    </span>

                    {addon && <span className="ml-1 shrink-0 pr-1 text-xs font-medium text-quaternary">{addon}</span>}

                    {state.selectionMode !== "none" && (avatarUrl || Icon) && <SelectionIndicator {...state} className="ml-1" />}

                    {state.hasSubmenu && <ChevronRight aria-hidden="true" className="ml-auto size-4 shrink-0 stroke-[2.25px] text-fg-quaternary" />}
                </div>
            )}
        </AriaMenuItem>
    );
};

type DropdownMenuProps<T extends object> = AriaMenuProps<T>;

const DropdownMenu = <T extends object>(props: DropdownMenuProps<T>) => {
    return (
        <AriaMenu
            {...props}
            className={(state) =>
                cx("flex h-min flex-col gap-0.5 overflow-y-auto p-1 outline-hidden select-none", typeof props.className === "function" ? props.className(state) : props.className)
            }
        />
    );
};

type DropdownPopoverProps = AriaPopoverProps;

const DropdownPopover = (props: DropdownPopoverProps) => {
    return (
        <AriaPopover
            placement="bottom right"
            {...props}
            className={(state) =>
                cx(
                    "w-[min(16rem,calc(100vw-2rem))] origin-(--trigger-anchor-point) overflow-auto rounded-[1.625rem] bg-popover shadow-xl ring-1 ring-secondary_alt md:rounded-[1.375rem] will-change-transform",
                    state.isEntering &&
                        "duration-150 ease-out animate-in fade-in placement-right:slide-in-from-left-0.5 placement-top:slide-in-from-bottom-0.5 placement-bottom:slide-in-from-top-0.5",
                    state.isExiting &&
                        "duration-100 ease-in animate-out fade-out placement-right:slide-out-to-left-0.5 placement-top:slide-out-to-bottom-0.5 placement-bottom:slide-out-to-top-0.5",
                    typeof props.className === "function" ? props.className(state) : props.className,
                )
            }
        >
            {props.children}
        </AriaPopover>
    );
};

const DropdownSeparator = (props: AriaSeparatorProps) => {
    return <AriaSeparator {...props} className={cx("my-1 mx-auto h-px w-[86%] bg-border-secondary", props.className)} />;
};

const DropdownDotsButton = (props: AriaButtonProps & RefAttributes<HTMLButtonElement>) => {
    return (
        <AriaButton
            {...props}
            aria-label="Open menu"
            className={(state) =>
                cx(
                    "cursor-pointer rounded-md text-fg-quaternary outline-focus-ring transition duration-100 ease-linear",
                    (state.isPressed || state.isHovered) && "text-fg-quaternary_hover",
                    (state.isPressed || state.isFocusVisible) && "outline-2 outline-offset-2",
                    typeof props.className === "function" ? props.className(state) : props.className,
                )
            }
        >
            <DotsVertical className="size-5 transition-inherit-all" />
        </AriaButton>
    );
};

export const Dropdown = {
    Root: AriaMenuTrigger,
    Popover: DropdownPopover,
    Menu: DropdownMenu,
    Section: AriaMenuSection,
    SectionHeader: AriaHeader,
    Item: DropdownItem,
    Separator: DropdownSeparator,
    DotsButton: DropdownDotsButton,
};
