"use client";

import Link from "next/link";
import { Book, Languages } from "lucide-react";

import { UiLanguageSelect } from "@/components/UiLanguageSelect";
import { UserMenu } from "@/components/UserMenu";
import { useMessages } from "@/app/hooks/useMessages";

export function AppNav() {
  const m = useMessages();

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/85 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70">
      <div className="grid h-16 w-full grid-cols-[1fr_auto_1fr] items-center px-4">
        <div className="flex justify-start">
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

            <span className="font-reading text-[24px] font-semibold leading-none tracking-tight text-zinc-900">
              Babeling
            </span>
          </Link>
        </div>

        <div className="hidden grid-flow-col auto-cols-fr gap-2 text-sm sm:grid">
          <Link
            className="
              group
              inline-flex w-full items-center justify-center gap-2
              rounded-md px-3 py-2
              font-ui font-medium text-zinc-600
              transition-colors hover:bg-zinc-100 hover:text-zinc-900
            "
            href="/upload"
          >
            <span className="inline-flex items-center justify-center">
              <Languages className="size-4" />
            </span>
            {m.nav.translate}
          </Link>
          <Link
            className="
              group
              inline-flex w-full items-center justify-center gap-2
              rounded-md px-3 py-2
              font-ui font-medium text-zinc-600
              transition-colors hover:bg-zinc-100 hover:text-zinc-900
            "
            href="/library"
          >
            <span className="inline-flex items-center justify-center">
              <Book className="size-4" />
            </span>
            {m.nav.library}
          </Link>
        </div>

        <div className="flex items-center justify-end gap-3">
          <UiLanguageSelect />
          <UserMenu />
        </div>
      </div>
    </nav>
  );
}
