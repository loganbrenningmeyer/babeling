import "./globals.css";
import { Libre_Baskerville, Manrope } from "next/font/google";

const reading = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-reading",
})

const ui = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-ui",
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${reading.variable} ${ui.variable}`}>
      <body className="font-ui min-h-screen bg-zinc-50 text-zinc-900">
        <nav className="sticky top-0 border-b border-black/10 bg-white">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
            <a className="font-semibold" href="/">Babeling</a>
            <div className="flex gap-4 text-sm">
              <a className="text-zinc-700 hover:text-zinc-950" href="/">Home</a>
              <a className="text-zinc-700 hover:text-zinc-950" href="/translate">Translate</a>
            </div>
          </div>
        </nav>

        <main className="w-full py-12">
          {children}
        </main>
      </body>
    </html>
  );
}
