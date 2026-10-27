import { ListPage } from "@/components/list-page";
import { UpcomingList } from "@/components/dashboard";
import { useCommitments } from "@/hooks/use-data";

export const UpcomingPage = () => {
    const { data, isPending } = useCommitments();

    return (
        <ListPage title="Upcoming" subtitle="Bills and commitments still ahead of you." loading={isPending}>
            <UpcomingList items={data ?? []} />
        </ListPage>
    );
};
