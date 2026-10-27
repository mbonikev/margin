import { MotionConfig } from "motion/react";
import { Route, Routes } from "react-router";
import { AppLayout } from "@/components/shell";
import { RequireAnon, RequireAuth, RequireRecovery } from "@/components/route-guards";
import { DashboardPage } from "@/pages/dashboard";
import { AccountsPage } from "@/pages/accounts";
import { ProfilePage } from "@/pages/profile";
import { SettingsPage } from "@/pages/settings";
import { ActivityPage } from "@/pages/activity";
import { UpcomingPage } from "@/pages/upcoming";
import { GoalsPage } from "@/pages/goals";
import { NotificationsPage } from "@/pages/notifications";
import { SignInPage } from "@/pages/sign-in";
import { SignUpPage } from "@/pages/sign-up";
import { ForgotPasswordPage } from "@/pages/forgot-password";
import { ResetPasswordPage } from "@/pages/reset-password";
import { usePreferences } from "@/providers";

const App = () => {
    const { preferences } = usePreferences();

    return (
        // "user" still honours the OS setting when animations are left on.
        <MotionConfig reducedMotion={preferences.reduceMotion ? "always" : "user"}>
            <Routes>
                <Route element={<RequireAuth />}>
                    <Route element={<AppLayout />}>
                        <Route index element={<DashboardPage />} />
                        <Route path="accounts" element={<AccountsPage />} />
                        <Route path="settings" element={<SettingsPage />} />
                        <Route path="profile" element={<ProfilePage />} />
                        {/* The destinations behind the dashboard's View all
                            buttons, which previously went nowhere. */}
                        <Route path="activity" element={<ActivityPage />} />
                        <Route path="upcoming" element={<UpcomingPage />} />
                        <Route path="goals" element={<GoalsPage />} />
                        <Route path="notifications" element={<NotificationsPage />} />
                    </Route>
                </Route>

                {/* Outside the layout: no nav bar before you are signed in. */}
                <Route element={<RequireAnon />}>
                    <Route path="/signin" element={<SignInPage />} />
                    <Route path="/signup" element={<SignUpPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                </Route>

                <Route element={<RequireRecovery />}>
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                </Route>
            </Routes>
        </MotionConfig>
    );
};

export default App;
