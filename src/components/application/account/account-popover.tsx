import type { FC } from "react";
import { Button as AriaButton, Dialog, DialogTrigger, Popover } from "react-aria-components";
import { HiOutlineArrowRightOnRectangle, HiOutlineCog6Tooth, HiOutlineUser } from "react-icons/hi2";
import { ThemeControls } from "@/components/application/theme/theme-controls";
import { Avatar } from "@/components/base/avatar/avatar";
import { Separator } from "@/components/foundations/separator";
import { cx } from "@/utils/cx";

const PanelItem = ({ icon: Icon, label, onPress }: { icon: FC<{ className?: string }>; label: string; onPress?: () => void }) => (
    <button
        type="button"
        onClick={onPress}
        className={cx(
            "flex h-9 w-full items-center rounded-full px-3.5 text-sm font-medium text-tertiary transition duration-100 ease-linear",
            "hover:bg-brand-primary hover:text-brand-secondary",
        )}
    >
        <Icon className="mr-3 size-5 shrink-0" />
        {label}
    </button>
);

export const AccountPopover = () => (
    <DialogTrigger>
        <AriaButton
            aria-label="Account menu"
            className="group ml-1.5 rounded-full outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
        >
            <Avatar size="sm" initials="K" alt="Your account" className="size-11 md:size-9" focusable />
        </AriaButton>

        <Popover
            placement="bottom right"
            offset={8}
            className={({ isEntering, isExiting }) =>
                cx(
                    "w-[min(16rem,calc(100vw-2rem))] origin-(--trigger-anchor-point) overflow-hidden rounded-3xl bg-primary shadow-xl will-change-transform",
                    isEntering && "duration-150 ease-out animate-in fade-in placement-bottom:slide-in-from-top-0.5",
                    isExiting && "duration-100 ease-in animate-out fade-out placement-bottom:slide-out-to-top-0.5",
                )
            }
        >
            <Dialog aria-label="Account" className="outline-hidden">
                <div className="flex flex-col gap-0.5 p-1">
                    <PanelItem icon={HiOutlineUser} label="View profile" />
                    <PanelItem icon={HiOutlineCog6Tooth} label="Settings" />
                </div>

                <Separator orientation="horizontal" className="mx-auto my-1 w-[86%]" />

                <ThemeControls />

                <Separator orientation="horizontal" className="mx-auto my-1 w-[86%]" />

                <div className="p-1">
                    <PanelItem icon={HiOutlineArrowRightOnRectangle} label="Sign out" />
                </div>
            </Dialog>
        </Popover>
    </DialogTrigger>
);
