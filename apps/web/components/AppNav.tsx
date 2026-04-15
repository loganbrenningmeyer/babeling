"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignUpButton } from "@clerk/nextjs";
import { Book, Languages, Layers } from "lucide-react";

import { ThemeToggle } from "@/components/ThemeToggle";
import { UiLanguageSelect } from "@/components/UiLanguageSelect";
import { UserMenu } from "@/components/UserMenu";
import { useMessages } from "@/app/hooks/useMessages";

export function AppNav() {
  const m = useMessages();
  const navItemClassName = `
    group
    inline-flex w-full items-center justify-center gap-2
    rounded-md px-3 py-2
    font-ui font-medium text-muted-foreground
    transition-colors hover:bg-accent hover:text-accent-foreground
  `;
  const mobileNavItemClassName = `
    group
    inline-flex min-w-0 flex-1 items-center justify-center gap-1.5
    rounded-md px-2 py-2
    font-ui text-xs font-medium text-muted-foreground
    transition-colors hover:bg-accent hover:text-accent-foreground
  `;

  return (
    <nav className="z-50 border-b border-border/80 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="flex h-16 w-full min-w-0 items-center justify-between gap-2 px-3 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:px-4">
        <div className="flex min-w-0 justify-start">
          <Link className="group inline-flex min-w-0 items-center gap-2" href="/">
            <span
              className="
                inline-flex h-8 w-8 shrink-0 items-center justify-center
                rounded-lg bg-foreground text-background
                shadow-sm
              "
              aria-hidden="true"
            >
              <Languages className="h-4 w-4" />
            </span>

            <span className="hidden min-w-0 truncate font-reading text-[21px] font-semibold leading-none tracking-tight text-foreground min-[380px]:inline sm:text-[24px]">
              Babeling
            </span>
          </Link>
        </div>

        <div className="hidden grid-flow-col auto-cols-fr gap-2 text-sm sm:grid">
          <SignedIn>
            {/* -------------------------
            //* Translate
            //* ------------------------- */}
            <Link className={navItemClassName} href="/upload">
              <span className="inline-flex items-center justify-center">
                <Languages className="size-4" />
              </span>
              {m.nav.translate}
            </Link>
            {/* -------------------------
            //* Library
            //* ------------------------- */}
            <Link className={navItemClassName} href="/library">
              <span className="inline-flex items-center justify-center">
                <Book className="size-4" />
              </span>
              {m.nav.library}
            </Link>
            {/* -------------------------
            //* Review
            //* ------------------------- */}
            <Link className={navItemClassName} href="/review">
              <span className="inline-flex items-center justify-center">
                <Layers className="size-4" />
              </span>
              {m.nav.review}
            </Link>
          </SignedIn>

          <SignedOut>
            <SignUpButton mode="modal" forceRedirectUrl="/upload" signInForceRedirectUrl="/upload">
              <button type="button" className={navItemClassName}>
                <span className="inline-flex items-center justify-center">
                  <Languages className="size-4" />
                </span>
                {m.nav.translate}
              </button>
            </SignUpButton>
            <SignUpButton mode="modal" forceRedirectUrl="/library" signInForceRedirectUrl="/library">
              <button type="button" className={navItemClassName}>
                <span className="inline-flex items-center justify-center">
                  <Book className="size-4" />
                </span>
                {m.nav.library}
              </button>
            </SignUpButton>
          </SignedOut>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
          <ThemeToggle />
          <UiLanguageSelect />
          <UserMenu />
        </div>
      </div>

      <div className="grid border-t border-border/70 px-2 py-1 sm:hidden">
        <div className="flex min-w-0 items-center gap-1">
          <SignedIn>
            <Link className={mobileNavItemClassName} href="/upload">
              <Languages className="size-4 shrink-0" />
              <span className="min-w-0 truncate">{m.nav.translate}</span>
            </Link>
            <Link className={mobileNavItemClassName} href="/library">
              <Book className="size-4 shrink-0" />
              <span className="min-w-0 truncate">{m.nav.library}</span>
            </Link>
            <Link className={mobileNavItemClassName} href="/review">
              <Layers className="size-4 shrink-0" />
              <span className="min-w-0 truncate">{m.nav.review}</span>
            </Link>
          </SignedIn>

          <SignedOut>
            <SignUpButton mode="modal" forceRedirectUrl="/upload" signInForceRedirectUrl="/upload">
              <button type="button" className={mobileNavItemClassName}>
                <Languages className="size-4 shrink-0" />
                <span className="min-w-0 truncate">{m.nav.translate}</span>
              </button>
            </SignUpButton>
            <SignUpButton mode="modal" forceRedirectUrl="/library" signInForceRedirectUrl="/library">
              <button type="button" className={mobileNavItemClassName}>
                <Book className="size-4 shrink-0" />
                <span className="min-w-0 truncate">{m.nav.library}</span>
              </button>
            </SignUpButton>
          </SignedOut>
        </div>
      </div>
    </nav>
  );
}
