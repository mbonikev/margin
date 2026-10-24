import { Tab, TabList, TabPanel, Tabs } from "react-aria-components";
import { AppearanceSettings } from "@/components/settings";
import { CurrencySettings } from "@/components/settings";
import { DashboardSettings } from "@/components/settings";
import { DataSettings } from "@/components/settings";
import { EmailSettings } from "@/components/settings";
import { MoneySettings } from "@/components/settings";
import { NotificationSettings } from "@/components/settings";
import { PrivacySettings } from "@/components/settings";
import { ProfileSettings } from "@/components/settings";
import { Card } from "@/components/ui";
import { cx } from "@/utils";

/** Ordered by how often a setting here gets changed, not by how it was built. */
const tabs = [
    { id: "profile", label: "Profile", panel: <ProfileSettings /> },
    { id: "appearance", label: "Appearance", panel: <AppearanceSettings /> },
    { id: "dashboard", label: "Dashboard", panel: <DashboardSettings /> },
    { id: "money", label: "Money", panel: <MoneySettings /> },
    { id: "currency", label: "Currency", panel: <CurrencySettings /> },
    { id: "email", label: "Morning email", panel: <EmailSettings /> },
    { id: "notifications", label: "Notifications", panel: <NotificationSettings /> },
    { id: "privacy", label: "Privacy", panel: <PrivacySettings /> },
    { id: "data", label: "Your data", panel: <DataSettings /> },
];

export const SettingsPage = () => (
    <Tabs defaultSelectedKey="appearance" className="flex flex-col gap-1.5 md:gap-2">
        {/* The strip scrolls rather than wraps: nine tabs in two rows on a phone
            would push the panel below the fold. */}
        <TabList aria-label="Settings" className="flex w-full gap-1 overflow-x-auto rounded-full bg-primary p-1 shadow-xs scrollbar-hide md:w-max">
            {tabs.map((tab) => (
                <Tab
                    key={tab.id}
                    id={tab.id}
                    className={({ isSelected }) =>
                        cx(
                            "flex h-9 shrink-0 cursor-pointer items-center rounded-full px-4 text-sm font-medium whitespace-nowrap transition duration-100 ease-linear outline-focus-ring focus-visible:outline-2 focus-visible:-outline-offset-2",
                            isSelected ? "bg-brand-primary text-brand-secondary" : "text-tertiary hover:text-secondary",
                        )
                    }
                >
                    {tab.label}
                </Tab>
            ))}
        </TabList>

        <Card className="p-5 md:p-6">
            {tabs.map((tab) => (
                <TabPanel key={tab.id} id={tab.id} className="outline-hidden">
                    {tab.panel}
                </TabPanel>
            ))}
        </Card>
    </Tabs>
);
