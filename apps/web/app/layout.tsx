import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { UserMenu } from "@/components/UserMenu";

import { Languages } from "lucide-react";
import { Library } from "lucide-react";
import { Manrope } from "next/font/google";

import Link from "next/link";
import localFont from "next/font/local";

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

const ui = Manrope({
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
    <html lang="en" className={`${readingLocal.variable} ${ui.variable}`}>
      <body className="font-ui min-h-screen bg-zinc-50 text-zinc-900 antialiased">
        <ClerkProvider
          afterSignOutUrl="/"
        >
          {/* -------------------------
          //* Nav Bar
          //* ------------------------- */}
          <nav className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/85 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
              <Link className="group inline-flex items-center gap-2.5" href="/">
                <span className="inline-flex size-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
                  <Languages className="size-4" />
                </span>
                <span className="font-semibold tracking-tight text-zinc-900">Babeling</span>
              </Link>

              {/* -------------------------
              //* Home / Translate
              //* ------------------------- */}
              <div className="hidden items-center gap-2 text-sm sm:flex">
                <div className="flex items-center justify-between">
                  <Link
                    className="
                      group 
                      inline-flex items-center gap-2
                      rounded-md px-3 py-2
                      font-medium text-zinc-600 
                      transition-colors hover:bg-zinc-100 hover:text-zinc-900
                    "
                    href="/translate"
                  >
                    <span className="inline-flex items-center justify-center">
                      <Languages className="size-4" />
                    </span>
                    Translate
                  </Link>
                </div>
                
                <div className="flex items-center justify-between">
                  <Link
                    className="
                      group 
                      inline-flex items-center gap-2
                      rounded-md px-3 py-2
                      font-medium text-zinc-600 
                      transition-colors hover:bg-zinc-100 hover:text-zinc-900
                    "
                    href="/library"
                  >
                    <span className="inline-flex items-center justify-center">
                      <Library className="size-4" />
                    </span>
                    Library
                  </Link>
                </div>
              </div>

              {/* -------------------------
              //* Sign-in / Sign-up / User Account
              //* ------------------------- */}
              <UserMenu />
            </div>
          </nav>

          <main className="w-full h-full">{children}</main>
        </ClerkProvider>
      </body>
    </html>
  );
}
