"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import type { AppRouter } from "@/server/trpc/root";
import { TRPCProvider } from "@/lib/trpc";

function getBaseUrl() {
  if (typeof window !== "undefined") return ""; // browser: relative URL
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
          fetch(url, options) {
            return fetch(url, { ...options, credentials: "include" });
          },
        }),
      ],
    }),
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
          {children}
          <Toaster />
        </TRPCProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
