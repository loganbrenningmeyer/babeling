import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

import { UserPreferencesProvider } from "@/components/UserPreferencesProvider";
import { AppNav } from "@/components/AppNav";

import { DM_Sans, Lora, DM_Serif_Display } from "next/font/google";


// -------------------------
// Logo Font
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${lora.variable} ${dm_sans.variable}`}>
      <body className="font-ui min-h-screen bg-zinc-50 text-zinc-900 antialiased">
        <ClerkProvider
          afterSignOutUrl="/"
        >
          <UserPreferencesProvider>
            <AppNav />

            <main className="w-full h-full">{children}</main>
          </UserPreferencesProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
