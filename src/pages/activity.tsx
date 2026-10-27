import { ListPage } from "@/components/list-page";
import { RecentActivity } from "@/components/dashboard";
import { useActivity } from "@/hooks/use-data";

export const ActivityPage = () => {
    // The dashboard card shows the newest handful; this is the whole history.
    const { data, isPending } = useActivity(500);

    return (
        <ListPage title="Activity" subtitle="Everything you've recorded, newest first." loading={isPending}>
            <RecentActivity items={data ?? []} />
        </ListPage>
    );
};
