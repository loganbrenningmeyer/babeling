import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { UserMenu } from "@/components/UserMenu";

import { UserPreferencesProvider } from "@/components/UserPreferencesProvider";
import { UiLanguageSelect } from "@/components/UiLanguageSelect";

import { Languages } from "lucide-react";
import { Book } from "lucide-react";
import { Manrope, DM_Sans, DM_Serif_Display } from "next/font/google";

import Link from "next/link";
import localFont from "next/font/local";


// -------------------------
// Logo Font
// -------------------------
const logo = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  variable: "--font-logo",
})

// -------------------------
// Reading Text Font
// -------------------------
export const readingLocal = localFont({
  src: [
    {
      path: "./fonts/charter/Charter-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/charter/Charter-Italic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "./fonts/charter/Charter-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/charter/Charter-Bold-Italic.ttf",
      weight: "700",
      style: "italic",
    },
  ],
  display: "swap",
  variable: "--font-reading",
});

// -------------------------
// General UI Font
// -------------------------
const ui = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-ui",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${logo.variable} ${readingLocal.variable} ${ui.variable}`}>
      <body className="font-ui min-h-screen bg-zinc-50 text-zinc-900 antialiased">
        <ClerkProvider
          afterSignOutUrl="/"
        >
          <UserPreferencesProvider>
            {/* -------------------------
            //* Nav Bar
            //* ------------------------- */}
            <nav className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/85 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70">
              <div className="relative flex h-16 w-full items-center px-4">
                <Link className="group inline-flex items-center gap-2" href="/">
                  <span
                    className="
                      inline-flex h-8 w-8 items-center justify-center
                      rounded-lg bg-zinc-900 text-white
                      shadow-sm
                    "
                    aria-hidden="true"
                  >
                    <Languages className="h-4 w-4" />
                  </span>

                  <span className="font-logo text-[24px] font-semibold leading-none tracking-tight text-zinc-900">
                    Babeling
                  </span>
                </Link>

                {/* -------------------------
                //* Home / Translate
                //* ------------------------- */}
                <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-2 text-sm sm:flex">
                  <Link
                    className="
                      group 
                      inline-flex items-center gap-2
                      rounded-md px-3 py-2
                      font-ui font-medium text-zinc-600 
                      transition-colors hover:bg-zinc-100 hover:text-zinc-900
                    "
                    href="/translate"
                  >
                    <span className="inline-flex items-center justify-center">
                      <Languages className="size-4" />
                    </span>
                    Translate
                  </Link>
                  <Link
                    className="
                      group 
                      inline-flex items-center gap-2
                      rounded-md px-3 py-2
                      font-ui font-medium text-zinc-600 
                      transition-colors hover:bg-zinc-100 hover:text-zinc-900
                    "
                    href="/library"
                  >
                    <span className="inline-flex items-center justify-center">
                      <Book className="size-4" />
                    </span>
                    Library
                  </Link>
                </div>

                {/* -------------------------
                //* UI Language Selector
                //* ------------------------- */}
                <div className="absolute right-1/8">
                  <UiLanguageSelect />
                </div>

                {/* -------------------------
                //* Sign-in / Sign-up / User Account
                //* ------------------------- */}
                <div className="ml-auto">
                  <UserMenu />
                </div>
              </div>
            </nav>

            <main className="w-full h-full">{children}</main>
          </UserPreferencesProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
