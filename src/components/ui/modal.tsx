import type { ReactNode } from "react";
import { Dialog, Modal as RacModal, ModalOverlay } from "react-aria-components";
import { cx } from "@/utils/cx";

interface ModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    label: string;
    children: ReactNode;
    className?: string;
}

/**
 * Bottom sheet on phones, centred panel from `sm` up — the same component either
 * way, because a centred dialog on a small screen puts the controls under the
 * thumb's blind spot.
 */
export const Modal = ({ isOpen, onOpenChange, label, children, className }: ModalProps) => (
    <ModalOverlay
        isDismissable
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        className={({ isEntering, isExiting }) =>
            cx(
                "fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4",
                isEntering && "duration-200 ease-out animate-in fade-in",
                isExiting && "duration-150 ease-in animate-out fade-out",
            )
        }
    >
        <RacModal
            className={({ isEntering, isExiting }) =>
                cx(
                    "w-full max-w-md rounded-t-3xl bg-popover shadow-xl ring-1 ring-popover sm:rounded-3xl",
                    isEntering && "duration-200 ease-out animate-in slide-in-from-bottom-4 sm:zoom-in-95 sm:slide-in-from-bottom-0",
                    isExiting && "duration-150 ease-in animate-out slide-out-to-bottom-4 sm:zoom-out-95 sm:slide-out-to-bottom-0",
                    className,
                )
            }
        >
            <Dialog aria-label={label} className="outline-hidden">
                {children}
            </Dialog>
        </RacModal>
    </ModalOverlay>
);
