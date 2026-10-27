import { ListPage } from "@/components/list-page";
import { SavingsGoals } from "@/components/dashboard";
import { useGoals } from "@/hooks/use-data";

export const GoalsPage = () => {
    const { data, isPending } = useGoals();

    // No `onViewAll` here, so the card shows its "New goal" action instead —
    // this page is where goals are actually managed (Issues.txt #15).
    return (
        <ListPage title="Goals" subtitle="What you're saving for, and how far along." loading={isPending}>
            <SavingsGoals goals={data ?? []} />
        </ListPage>
    );
};
