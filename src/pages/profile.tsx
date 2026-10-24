import { HiOutlineArrowRightOnRectangle, HiOutlineCog6Tooth, HiOutlineEnvelope, HiOutlineFire } from "react-icons/hi2";
import { useNavigate } from "react-router";
import { Avatar } from "@/components/base/avatar";
import { ActionButton } from "@/components/ui";
import { Amount } from "@/components/ui";
import { Card } from "@/components/ui";
import { useAccounts } from "@/providers";

const joined = new Date(Date.now() - 214 * 86_400_000);
const joinedFormat = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });

export const ProfilePage = () => {
    const navigate = useNavigate();
    const { accounts } = useAccounts();
    const total = accounts.reduce((sum, account) => sum + account.balance, 0);

    return (
        <div className="flex flex-col gap-1.5 md:gap-2">
            <Card className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <Avatar size="2xl" initials="K" alt="Kevin" className="size-20 shrink-0" />

                <div className="min-w-0 flex-1">
                    <h1 className="truncate text-3xl font-semibold tracking-tight text-primary md:text-4xl">Kevin</h1>
                    <p className="mt-1 truncate text-md text-tertiary">kevin@example.com</p>
                    <p className="mt-1 text-sm text-quaternary">Keeping a margin since {joinedFormat.format(joined)}</p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-1.5">
                    <ActionButton icon={HiOutlineCog6Tooth} onClick={() => void navigate("/settings")}>
                        Settings
                    </ActionButton>
                    <ActionButton icon={HiOutlineArrowRightOnRectangle} onClick={() => void navigate("/signin")}>
                        Sign out
                    </ActionButton>
                </div>
            </Card>

            <section aria-label="Your numbers" className="grid min-w-0 gap-1.5 md:grid-cols-3 md:gap-2">
                <Card>
                    <p className="text-xs font-medium text-tertiary md:text-sm">Tracked across</p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-primary md:text-3xl">{accounts.length} accounts</p>
                </Card>

                <Card>
                    <p className="text-xs font-medium text-tertiary md:text-sm">Total balance</p>
                    <Amount value={total} compactSymbol compact className="mt-1 block truncate text-2xl font-semibold tracking-tight text-primary md:text-3xl" />
                </Card>

                <Card>
                    <p className="flex items-center gap-1.5 text-xs font-medium text-tertiary md:text-sm">
                        <HiOutlineFire className="size-4" />
                        Morning streak
                    </p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-primary md:text-3xl">14 days</p>
                </Card>
            </section>

            <Card className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-primary text-brand-secondary">
                        <HiOutlineEnvelope className="size-5" />
                    </span>
                    <div>
                        <p className="text-sm font-medium text-primary">Morning email is on</p>
                        <p className="text-xs text-tertiary">Arriving at 07:00 in your timezone.</p>
                    </div>
                </div>

                <ActionButton onClick={() => void navigate("/settings")}>Change</ActionButton>
            </Card>
        </div>
    );
};
