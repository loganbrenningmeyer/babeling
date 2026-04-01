import Link from "next/link";
import type { CSSProperties } from "react";
import { SignUpButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight } from "lucide-react";

import { AuthModalLauncher } from "@/app/components/AuthModalLauncher";
import { Button } from "@/components/ui/button";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { userId } = await auth();
  const sp = await searchParams;

  const surfaceTheme = {
    "--home-accent-a": "rgba(235, 126, 63, 0.34)",
    "--home-accent-b": "rgba(22, 104, 129, 0.28)",
    "--home-accent-c": "rgba(208, 66, 102, 0.16)",
    "--home-accent-d": "rgba(255, 248, 238, 0.7)",
  } as CSSProperties;

  const redirectedModalTarget =
    typeof sp.redirect_to === "string" && sp.redirect_to.startsWith("/")
      ? sp.redirect_to
      : "/upload";
  const authRequestKey =
    typeof sp.auth_request === "string" ? sp.auth_request : redirectedModalTarget;
  const shouldAutoOpenSignUp = !userId && sp.auth === "sign-up";
  const startReadingButtonClassName =
    "group relative h-12 overflow-hidden rounded-full border border-black/10 bg-slate-950 px-6 font-ui text-sm text-stone-50 shadow-[0_14px_34px_rgba(15,23,42,0.14)] transition-[transform,box-shadow,background-color,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:border-black/20 hover:bg-slate-900 hover:shadow-[0_20px_44px_rgba(15,23,42,0.2)] motion-reduce:transform-none motion-reduce:transition-none dark:border-white/10 dark:bg-stone-100 dark:text-slate-950 dark:shadow-none dark:hover:border-white/20 dark:hover:bg-stone-200 dark:hover:shadow-none";
  const startReadingButtonContent = (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-10 bg-[linear-gradient(120deg,transparent_15%,rgba(255,255,255,0.18)_48%,transparent_82%)] opacity-0 transition-[opacity,transform] duration-500 ease-out group-hover:translate-x-6 group-hover:opacity-100 motion-reduce:transform-none motion-reduce:transition-none dark:bg-[linear-gradient(120deg,transparent_15%,rgba(15,23,42,0.08)_48%,transparent_82%)]"
      />
      <span className="relative z-10">Start Reading</span>
      <ArrowRight className="relative z-10 size-4 transition-transform duration-300 ease-out group-hover:translate-x-1 motion-reduce:transition-none" />
    </>
  );

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-[#f4efe6] text-slate-950 dark:bg-[#101315] dark:text-stone-100"
      style={surfaceTheme}
    >
      {shouldAutoOpenSignUp ? (
        <AuthModalLauncher
          key={authRequestKey}
          forceRedirectUrl={redirectedModalTarget}
        />
      ) : null}

      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:clamp(42px,6vw,68px)_clamp(42px,6vw,68px)] opacity-50 dark:bg-[linear-gradient(to_right,rgba(248,250,252,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(248,250,252,0.05)_1px,transparent_1px)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.45),transparent_42%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_42%)]" />
        <div className="absolute -left-28 top-0 h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,var(--home-accent-a)_0%,transparent_70%)] blur-3xl" />
        <div className="absolute right-[-5rem] top-[12%] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,var(--home-accent-b)_0%,transparent_70%)] blur-3xl" />
        <div className="absolute bottom-[-7rem] left-[10%] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,var(--home-accent-c)_0%,transparent_74%)] blur-3xl dark:opacity-80" />
        <div className="absolute bottom-[12%] right-[14%] h-[10rem] w-[18rem] rotate-[-16deg] rounded-full border border-black/8 bg-[color:var(--home-accent-d)] blur-2xl dark:border-white/10 dark:bg-white/5" />
        <div className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/8 dark:border-white/10" />
        <div className="absolute left-1/2 top-1/2 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/8 dark:border-white/10" />
        <div className="absolute left-1/2 top-1/2 h-[14rem] w-[14rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/7 dark:border-white/8" />
      </div>

      <main className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-12 sm:px-8">
        <section className="animate-in fade-in slide-in-from-bottom-8 flex w-full max-w-4xl flex-col items-center text-center duration-700">
          <h1 className="font-reading text-[clamp(5.5rem,17vw,11rem)] font-semibold leading-[0.88] tracking-[-0.06em] text-slate-950 dark:text-stone-100">
            Babeling
          </h1>

          <div className="mt-10">
            {userId ? (
              <Button
                asChild
                size="lg"
                className={startReadingButtonClassName}
              >
                <Link href="/upload">{startReadingButtonContent}</Link>
              </Button>
            ) : (
              <SignUpButton
                mode="modal"
                forceRedirectUrl="/upload"
                signInForceRedirectUrl="/upload"
              >
                <Button
                  size="lg"
                  className={startReadingButtonClassName}
                >
                  {startReadingButtonContent}
                </Button>
              </SignUpButton>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
