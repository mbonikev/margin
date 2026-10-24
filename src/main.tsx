import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "@/App";
import { AccountsProvider } from "@/providers";
import { CurrencyProvider } from "@/providers";
import { PreferencesProvider } from "@/providers";
import { PrivacyProvider } from "@/providers";
import { ThemeProvider } from "@/providers";
import "styles/globals.css";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <PreferencesProvider>
            <ThemeProvider>
                <CurrencyProvider>
                    <PrivacyProvider>
                        <AccountsProvider>
                            <BrowserRouter>
                                <App />
                            </BrowserRouter>
                        </AccountsProvider>
                    </PrivacyProvider>
                </CurrencyProvider>
            </ThemeProvider>
        </PreferencesProvider>
    </StrictMode>,
);
