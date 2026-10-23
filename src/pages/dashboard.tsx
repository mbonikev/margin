import { Card } from "@/components/base/card/card";

export const DashboardPage = () => {
    return (
        <section
            aria-label="Overview"
            className="grid gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)_minmax(0,1fr)]"
        >
            {/* Left — four stat tiles in a 2x2 */}
            <div className="grid grid-cols-2 gap-3 md:gap-4">
                <Card className="min-h-32 md:min-h-36" />
                <Card className="min-h-32 md:min-h-36" />
                <Card className="min-h-32 md:min-h-36" />
                <Card className="min-h-32 md:min-h-36" />
            </div>

            {/* Middle — the hero, stretches to the full height of the section */}
            <Card className="min-h-72 lg:min-h-0" />

            {/* Right — same width as the left column, full height */}
            <Card className="min-h-72 md:col-span-2 lg:col-span-1 lg:min-h-0" />
        </section>
    );
};
