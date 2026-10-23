import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "@/App";
import { CurrencyProvider } from "@/providers/currency-provider";
import { PrivacyProvider } from "@/providers/privacy-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import "styles/globals.css";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ThemeProvider>
            <CurrencyProvider>
                <PrivacyProvider>
                    <BrowserRouter>
                        <App />
                    </BrowserRouter>
                </PrivacyProvider>
            </CurrencyProvider>
        </ThemeProvider>
    </StrictMode>,
);
