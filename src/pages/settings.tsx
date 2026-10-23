import { Tab, TabList, TabPanel, Tabs } from "react-aria-components";
import { CurrencySettings } from "@/components/application/settings/currency-settings";
import { ThemeControls } from "@/components/application/theme/theme-controls";
import { Card } from "@/components/base/card/card";
import { cx } from "@/utils/cx";

const tabs = [
    { id: "profile", label: "Profile" },
    { id: "currency", label: "Currency" },
    { id: "email", label: "Morning email" },
    { id: "appearance", label: "Appearance" },
];

const Placeholder = ({ title, note }: { title: string; note: string }) => (
    <div>
        <h2 className="text-md font-semibold text-primary">{title}</h2>
        <p className="mt-0.5 text-sm text-tertiary">{note}</p>
    </div>
);

export const SettingsPage = () => (
    <Tabs defaultSelectedKey="currency" className="flex flex-col gap-3">
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
            <TabPanel id="profile" className="outline-hidden">
                <Placeholder title="Profile" note="Your name, email and timezone. Timezone decides when the morning email lands." />
            </TabPanel>

            <TabPanel id="currency" className="outline-hidden">
                <CurrencySettings />
            </TabPanel>

            <TabPanel id="email" className="outline-hidden">
                <Placeholder title="Morning email" note="Send time, tone, and whether quiet days are skipped." />
            </TabPanel>

            <TabPanel id="appearance" className="outline-hidden">
                <div className="flex flex-col gap-1">
                    <h2 className="text-md font-semibold text-primary">Appearance</h2>
                    <div className="-mx-2 max-w-sm">
                        <ThemeControls />
                    </div>
                </div>
            </TabPanel>
        </Card>
    </Tabs>
);
