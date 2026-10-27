import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import App from "@/App";
import { queryClient } from "@/lib/query";
import { AuthProvider } from "@/auth-provider";
import { AccountsProvider } from "@/providers";
import { CurrencyProvider } from "@/providers";
import { PreferencesProvider } from "@/providers";
import { PrivacyProvider } from "@/providers";
import { ThemeProvider } from "@/providers";
import "styles/globals.css";

// Order matters: the query client wraps everything because AuthProvider clears
// its cache on sign-out, and AuthProvider sits above the data providers because
// each of them waits on a session before fetching.
createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <PreferencesProvider>
                    <ThemeProvider>
                        <CurrencyProvider>
                            <PrivacyProvider>
                                <AccountsProvider>
                                    <BrowserRouter>
                                        <App />
                                        {/* Theme tokens rather than fixed colours, so toasts
                                            follow light/dark with the rest of the app. The
                                            pill shape matches the buttons and inputs. */}
                                        <Toaster
                                            position="bottom-center"
                                            gutter={8}
                                            toastOptions={{
                                                duration: 3500,
                                                className: "!rounded-full !bg-primary !text-primary !shadow-lg !text-sm !font-medium !px-4 !py-3",
                                                success: { iconTheme: { primary: "var(--color-brand-solid)", secondary: "var(--color-bg-primary)" } },
                                                error: { duration: 5000, iconTheme: { primary: "var(--color-fg-error-primary)", secondary: "var(--color-bg-primary)" } },
                                            }}
                                        />
                                    </BrowserRouter>
                                </AccountsProvider>
                            </PrivacyProvider>
                        </CurrencyProvider>
                    </ThemeProvider>
                </PreferencesProvider>
            </AuthProvider>
        </QueryClientProvider>
    </StrictMode>,
);
