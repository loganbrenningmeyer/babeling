import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

import { UserPreferencesProvider } from "@/components/UserPreferencesProvider";
import { AppNav } from "@/components/AppNav";

import { DM_Sans, Lora } from "next/font/google";


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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${lora.variable} ${dm_sans.variable}`}>
      <body className="font-ui min-h-screen antialiased">
        <ClerkProvider
          afterSignOutUrl="/"
        >
          <UserPreferencesProvider>
            <AppNav />

            <main className="w-full h-full pt-16">{children}</main>
          </UserPreferencesProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
