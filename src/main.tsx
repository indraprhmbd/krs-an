import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext.tsx";

// SECURITY: Enforce proper environment configuration
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL as string;
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

// Validate required environment variables
if (!CONVEX_URL || !PUBLISHABLE_KEY) {
  throw new Error(
    "Missing required environment variables. Please configure VITE_CONVEX_URL and VITE_CLERK_PUBLISHABLE_KEY",
  );
}

const convex = new ConvexReactClient(CONVEX_URL);

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <LanguageProvider>
              <App />
            </LanguageProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  </StrictMode>,
);
