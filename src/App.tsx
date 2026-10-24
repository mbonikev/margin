import { MotionConfig } from "motion/react";
import { Route, Routes } from "react-router";
import { AppLayout } from "@/components/shell";
import { DashboardPage } from "@/pages/dashboard";
import { AccountsPage } from "@/pages/accounts";
import { ProfilePage } from "@/pages/profile";
import { SettingsPage } from "@/pages/settings";
import { SignInPage } from "@/pages/sign-in";
import { usePreferences } from "@/providers";

const App = () => {
    const { preferences } = usePreferences();

    return (
        // "user" still honours the OS setting when animations are left on.
        <MotionConfig reducedMotion={preferences.reduceMotion ? "always" : "user"}>
            <Routes>
                <Route element={<AppLayout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="accounts" element={<AccountsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                </Route>

                {/* Outside the layout: no nav bar before you are signed in. */}
                <Route path="/signin" element={<SignInPage />} />
            </Routes>
        </MotionConfig>
    );
};

export default App;
