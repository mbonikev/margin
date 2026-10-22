import { Route, Routes } from "react-router";
import { AppLayout } from "@/components/layout/app-layout";
import { DashboardPage } from "@/pages/dashboard";
import { AccountsPage } from "@/pages/accounts";

const App = () => (
    <Routes>
        <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="accounts" element={<AccountsPage />} />
        </Route>
    </Routes>
);

export default App;
