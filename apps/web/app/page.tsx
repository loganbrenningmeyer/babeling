import Link from "next/link";
import type { CSSProperties } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  AudioLines,
  BookOpenCheck,
  BookOpenText,
  Languages,
  Sparkles,
  Workflow,
} from "lucide-react";

const featureHighlights = [
  {
    title: "Sentence + Word Alignment",
    description:
      "Trace meaning from one language to another with deterministic token mapping that keeps context intact.",
    icon: BookOpenCheck,
    tone: "bg-cyan-50/80 ring-cyan-100 dark:bg-cyan-400/10 dark:ring-cyan-400/18",
    iconTone: "text-cyan-700 bg-cyan-100 dark:text-cyan-300 dark:bg-cyan-400/14",
  },
  {
    title: "Dictionary + Grammar Insight",
    description:
      "Tap any token for concise definitions and natural-language explanations without breaking your reading flow.",
    icon: Sparkles,
    tone: "bg-amber-50/80 ring-amber-100 dark:bg-amber-400/10 dark:ring-amber-400/18",
    iconTone: "text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-400/14",
  },
  {
    title: "Pronunciation on Demand",
    description:
      "Play clear audio for words, sentences, or paragraphs to train your ear while you build vocabulary.",
    icon: AudioLines,
    tone: "bg-orange-50/80 ring-orange-100 dark:bg-orange-400/10 dark:ring-orange-400/18",
    iconTone: "text-orange-700 bg-orange-100 dark:text-orange-300 dark:bg-orange-400/14",
  },
];

const workflowSteps = [
  {
    title: "Bring your text",
    description: "Paste content or upload a file. Babeling segments pages so long passages stay easy to read.",
    icon: BookOpenText,
  },
  {
    title: "Translate + align",
    description: "Get a translated pane first, then sentence and token-level alignment layers for precise study.",
    icon: Languages,
  },
  {
    title: "Explore deeply",
    description: "Hover words for explanations, reveal blur levels, and play pronunciation where it matters.",
    icon: Workflow,
  },
];

export default function Home() {
  const surfaceTheme = {
    "--home-accent-a": "rgba(14, 116, 144, 0.24)",
    "--home-accent-b": "rgba(245, 158, 11, 0.24)",
    "--home-accent-c": "rgba(15, 23, 42, 0.08)",
  } as CSSProperties;

  return (
    <div className="relative overflow-hidden bg-background" style={surfaceTheme}>
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-28 -top-16 h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,var(--home-accent-a)_0%,transparent_70%)] opacity-100 blur-2xl dark:opacity-45" />
        <div className="absolute -right-20 top-24 h-[20rem] w-[20rem] rounded-full bg-[radial-gradient(circle,var(--home-accent-b)_0%,transparent_68%)] opacity-100 blur-2xl dark:opacity-45" />
        <div className="absolute left-1/3 top-32 h-[16rem] w-[16rem] rounded-full bg-[radial-gradient(circle,var(--home-accent-c)_0%,transparent_72%)] opacity-100 blur-xl dark:opacity-35" />
        <div className="absolute inset-x-0 top-0 h-[30rem] bg-[linear-gradient(180deg,white_0%,#f8fafc_45%,transparent_100%)] dark:bg-[linear-gradient(180deg,rgba(18,18,18,0.98)_0%,rgba(18,18,18,0.88)_44%,rgba(18,18,18,0)_100%)]" />
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <section className="py-10 md:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
              <span className="inline-flex items-center rounded-full border border-cyan-200/80 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700 backdrop-blur dark:border-cyan-400/25 dark:bg-cyan-400/8 dark:text-cyan-300">
                Bilingual Reading, Rebuilt
              </span>
              <h1 className="mt-5 font-reading text-4xl font-bold leading-tight text-foreground md:text-6xl md:leading-[1.05]">
                Read between languages, not around them.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Babeling helps you translate, align, and understand real text with context-aware explanations
                and pronunciation. Move from guessing to seeing exactly how meaning maps across languages.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="gap-2 bg-foreground text-background hover:bg-foreground/90">
                  <Link href="/translate">
                    Start Reading
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                {/* -------------------------
                //* Clerk /me test
                //* ------------------------- */}
                <Button asChild variant="outline" size="lg" className="border-border bg-background/80 dark:bg-card dark:hover:bg-muted/60">
                  <Link href="#how-it-works">See How It Works</Link>
                </Button>
              </div>
              <div className="mt-8 grid max-w-lg grid-cols-3 gap-3 text-sm">
                <div className="rounded-xl border border-border bg-card/80 px-3 py-3 text-center shadow-sm dark:bg-card/95 dark:shadow-none">
                  <p className="font-semibold text-card-foreground">Sentence + word</p>
                  <p className="mt-1 text-muted-foreground">alignment</p>
                </div>
                <div className="rounded-xl border border-border bg-card/80 px-3 py-3 text-center shadow-sm dark:bg-card/95 dark:shadow-none">
                  <p className="font-semibold text-card-foreground">Inline cards</p>
                  <p className="mt-1 text-muted-foreground">define + explain</p>
                </div>
                <div className="rounded-xl border border-border bg-card/80 px-3 py-3 text-center shadow-sm dark:bg-card/95 dark:shadow-none">
                  <p className="font-semibold text-card-foreground">Natural audio</p>
                  <p className="mt-1 text-muted-foreground">word to paragraph</p>
                </div>
              </div>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
              <div className="rounded-3xl border border-border bg-card/95 p-4 shadow-xl shadow-cyan-950/5 dark:bg-card dark:shadow-none md:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-semibold text-card-foreground">Reader Preview</p>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground dark:bg-background/70">
                    Source EN -&gt; Target ES
                  </span>
                </div>
                <div className="space-y-4">
                  <div className="rounded-2xl border border-border bg-muted/60 p-4 dark:bg-background/60">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Source</p>
                    <p className="mt-2 font-reading text-lg leading-relaxed text-foreground">
                      Learning a language gets easier when every sentence has context.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4 dark:border-cyan-400/20 dark:bg-cyan-400/10">
                    <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">Translation</p>
                    <p className="mt-2 font-reading text-lg leading-relaxed text-foreground">
                      Aprender un idioma es mas facil cuando cada frase tiene contexto.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-2.5 py-1 dark:bg-background/70">learning -&gt; aprender</span>
                    <span className="rounded-full bg-muted px-2.5 py-1 dark:bg-background/70">sentence -&gt; frase</span>
                    <span className="rounded-full bg-muted px-2.5 py-1 dark:bg-background/70">context -&gt; contexto</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-6 pt-4 md:pb-10" aria-label="Core features">
          <div className="grid gap-4 md:grid-cols-3">
            {featureHighlights.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.title}
                  className={`group border-0 ring-1 ${feature.tone} animate-in fade-in slide-in-from-bottom-4 duration-700`}
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  <CardContent className="space-y-4 p-6">
                    <div className={`inline-flex rounded-xl p-2.5 ${feature.iconTone}`}>
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section id="how-it-works" className="py-12 md:py-16">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">How it works</p>
            <h2 className="mt-3 font-reading text-3xl font-bold text-foreground md:text-4xl">
              Fast from first paste to deep understanding
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="rounded-2xl border border-border bg-card p-5 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700 dark:shadow-none"
                  style={{ animationDelay: `${index * 140}ms` }}
                >
                  <div className="mb-4 inline-flex rounded-full border border-border bg-muted/60 p-2.5 text-muted-foreground">
                    <Icon className="size-5" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step {index + 1}</p>
                  <h3 className="mt-2 text-lg font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="pb-8 pt-2 md:pb-14">
          <div className="rounded-3xl border border-border bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_35%,#ecfeff_100%)] p-7 shadow-sm dark:bg-[linear-gradient(135deg,rgba(27,27,27,1)_0%,rgba(30,38,47,1)_45%,rgba(13,27,39,1)_100%)] dark:shadow-none md:p-10">
            <div className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-center">
              <div>
                <h2 className="font-reading text-3xl font-bold text-foreground md:text-4xl">
                  Designed for focused language reading
                </h2>
                <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">
                  Babeling combines translation, alignment, explanations, and pronunciation in one interface so
                  momentum never breaks. Spend more time reading, less time tab-switching.
                </p>
              </div>
              <div className="flex flex-col gap-3 md:items-end">
                <Button asChild size="lg" className="w-full gap-2 md:w-auto">
                  <Link href="/translate">
                    Open Translator
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <p className="text-sm text-muted-foreground md:text-right">
                  Works best when you translate first, then inspect alignment and explanations.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
