import { Button as AriaButton } from "react-aria-components";
import { HiOutlineEye, HiOutlineEyeSlash } from "react-icons/hi2";
import { usePrivacy } from "@/providers/privacy-provider";

export const PrivacyToggle = () => {
    const { hidden, toggle } = usePrivacy();
    const Icon = hidden ? HiOutlineEyeSlash : HiOutlineEye;

    return (
        <AriaButton
            onPress={toggle}
            aria-pressed={hidden}
            aria-label={hidden ? "Show amounts" : "Hide amounts"}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-tertiary shadow-xs transition duration-100 ease-linear outline-focus-ring hover:text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 md:size-9"
        >
            <Icon className="size-5" />
        </AriaButton>
    );
};
