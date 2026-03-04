"use client";

import Link from "next/link";
import { Book, Languages } from "lucide-react";

import { ThemeToggle } from "@/components/ThemeToggle";
import { UiLanguageSelect } from "@/components/UiLanguageSelect";
import { UserMenu } from "@/components/UserMenu";
import { useMessages } from "@/app/hooks/useMessages";

export function AppNav() {
  const m = useMessages();

  return (
    <nav className="z-50 border-b border-border/80 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="grid h-16 w-full grid-cols-[1fr_auto_1fr] items-center px-4">
        <div className="flex justify-start">
          <Link className="group inline-flex items-center gap-2" href="/">
            <span
              className="
                inline-flex h-8 w-8 items-center justify-center
                rounded-lg bg-foreground text-background
                shadow-sm
              "
              aria-hidden="true"
            >
              <Languages className="h-4 w-4" />
            </span>

            <span className="font-reading text-[24px] font-semibold leading-none tracking-tight text-foreground">
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
              font-ui font-medium text-muted-foreground
              transition-colors hover:bg-accent hover:text-accent-foreground
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
              font-ui font-medium text-muted-foreground
              transition-colors hover:bg-accent hover:text-accent-foreground
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
          <ThemeToggle />
          <UiLanguageSelect />
          <UserMenu />
        </div>
      </div>
    </nav>
  );
}
