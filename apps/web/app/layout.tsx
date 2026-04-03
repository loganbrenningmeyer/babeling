import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

import { UserPreferencesProvider } from "@/components/UserPreferencesProvider";
import { AppNav } from "@/components/AppNav";
import { getInitialTheme } from "@/lib/server-api";

import { DM_Sans, Lora, Libre_Baskerville, IBM_Plex_Serif } from "next/font/google";


// -------------------------
// Reading Font
// -------------------------
const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-lora",
})

// -------------------------
// General UI Font
// -------------------------
const dm_sans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-dm_sans",
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialTheme = await getInitialTheme();

  return (
    <html
      lang="en"
      className={`${lora.variable} ${dm_sans.variable}${initialTheme === "dark" ? " dark" : ""}`}
    >
      <body className="font-ui min-h-screen antialiased">
        <ClerkProvider
          afterSignOutUrl="/"
        >
          <UserPreferencesProvider initialTheme={initialTheme ?? "system"}>
            <AppNav />

            <main className="w-full h-full">{children}</main>
          </UserPreferencesProvider>
        </ClerkProvider>
        {/* -------------------------
        * Vercel Performance Metrics
        * ------------------------- */}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
