"use client";

import type { ReactNode } from "react";
import { Globe2, Languages, Monitor, Moon, Sparkles, Sun } from "lucide-react";

import { ThemeToggle } from "@/components/ThemeToggle";
import { useUserPreferences } from "@/components/UserPreferencesProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getLangLabel, getUiLangsMap, toUiLang } from "@/app/i18n/messages";
import { useMessages } from "@/app/hooks/useMessages";
import { cn } from "@/lib/utils";

type ThemePref = "system" | "light" | "dark";

const CONTENT_LANGS = ["en", "es", "fr", "de", "it"] as const;

function PreferenceField({
  id,
  label,
  description,
  value,
  onValueChange,
  options,
}: {
  id: string;
  label: string;
  description: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm">
      <div className="mb-3">
        <Label className="font-ui text-sm font-semibold text-foreground" htmlFor={id}>
          {label}
        </Label>
        <p className="mt-1 text-sm text-muted-foreground">
          {description}
        </p>
      </div>

      <Select onValueChange={onValueChange} value={value}>
        <SelectTrigger
          className="w-full bg-muted/40 font-ui"
          id={id}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start" position="popper">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ThemeOptionButton({
  icon,
  label,
  description,
  value,
  selected,
  onSelect,
}: {
  icon: ReactNode;
  label: string;
  description: string;
  value: ThemePref;
  selected: boolean;
  onSelect: (value: ThemePref) => void;
}) {
  return (
    <button
      aria-pressed={selected}
      className={cn(
        `
          flex w-full items-start gap-3 rounded-2xl border p-4 text-left
          transition-colors duration-200
          focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-ring focus-visible:ring-offset-2
          focus-visible:ring-offset-background
        `,
        selected
          ? "border-foreground/10 bg-foreground text-background shadow-sm"
          : "border-border/70 bg-background/80 text-foreground hover:bg-muted/60"
      )}
      onClick={() => onSelect(value)}
      type="button"
    >
      <span
        className={cn(
          "mt-0.5 inline-flex size-9 items-center justify-center rounded-xl border",
          selected
            ? "border-white/15 bg-white/10"
            : "border-border/70 bg-muted/60"
        )}
      >
        {icon}
      </span>

      <span className="min-w-0">
        <span className="block font-ui text-sm font-semibold">{label}</span>
        <span
          className={cn(
            "mt-1 block text-sm",
            selected ? "text-background/70" : "text-muted-foreground"
          )}
        >
          {description}
        </span>
      </span>
    </button>
  );
}

export default function PreferencesPage() {
  const {
    loading,
    srcLang,
    tgtLang,
    theme,
    uiLang,
    setSrcLang,
    setTgtLang,
    setTheme,
    setUiLang,
  } = useUserPreferences();
  const m = useMessages();

  const resolvedUiLang = toUiLang(uiLang);
  const uiLanguageOptions = getUiLangsMap(resolvedUiLang).map((lang) => ({
    value: lang.code,
    label: lang.label,
  }));
  const contentLanguageOptions = [
    { value: "none", label: "No preference" },
    ...CONTENT_LANGS.map((code) => ({
      value: code,
      label: m.langs[code],
    })),
  ];

  const sourceValue = srcLang ?? "none";
  const targetValue = tgtLang ?? "none";
  const sourceLabel =
    sourceValue === "none" ? "Auto" : getLangLabel(sourceValue, m.langs);
  const targetLabel =
    targetValue === "none" ? "Auto" : getLangLabel(targetValue, m.langs);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8 lg:py-12">
        <section
          className="
            relative overflow-hidden rounded-3xl border border-border/70
            bg-gradient-to-br from-amber-100/70 via-background to-sky-100/60
            p-6 shadow-sm
            dark:from-amber-950/20 dark:via-background dark:to-sky-950/20
          "
        >
          <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-white/30 to-transparent dark:from-white/5" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-ui font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <Sparkles className="size-3.5" />
                Personalize
              </div>
              <h1 className="mt-4 font-reading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                {m.nav.preferences}
              </h1>
              <p className="mt-3 max-w-xl font-ui text-sm leading-6 text-muted-foreground sm:text-base">
                Set the default languages and appearance Babeling should use
                whenever you start a new reading session.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3 shadow-sm">
                <p className="text-[11px] font-ui font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Source
                </p>
                <p className="mt-2 font-reading text-xl font-semibold">
                  {sourceLabel}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3 shadow-sm">
                <p className="text-[11px] font-ui font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Target
                </p>
                <p className="mt-2 font-reading text-xl font-semibold">
                  {targetLabel}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3 shadow-sm">
                <p className="text-[11px] font-ui font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Theme
                </p>
                <p className="mt-2 font-reading text-xl font-semibold capitalize">
                  {theme}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6">
          <Card className="gap-0 overflow-hidden border-border/70 bg-card/95 pt-0 pb-6">
            <CardHeader className="border-b border-border/70 bg-muted/30 pt-6">
              <div className="flex items-start gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-foreground text-background shadow-sm">
                  <Languages className="size-5" />
                </span>
                <div>
                  <CardTitle className="font-reading text-2xl">
                    Language Defaults
                  </CardTitle>
                  <CardDescription className="mt-1 font-ui">
                    These selections prefill the app for future uploads, reader
                    sessions, and interface copy.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
              <PreferenceField
                description="Choose the language your original text usually starts in."
                id="preferred-src-lang"
                label="Preferred source language"
                onValueChange={(value) =>
                  setSrcLang(value === "none" ? null : value)
                }
                options={contentLanguageOptions}
                value={sourceValue}
              />

              <PreferenceField
                description="Set the translation language you want preselected most often."
                id="preferred-tgt-lang"
                label="Preferred target language"
                onValueChange={(value) =>
                  setTgtLang(value === "none" ? null : value)
                }
                options={contentLanguageOptions}
                value={targetValue}
              />

              <div className="sm:col-span-2">
                <PreferenceField
                  description="This changes menus, controls, and labels throughout the app."
                  id="preferred-ui-lang"
                  label="Interface language"
                  onValueChange={setUiLang}
                  options={uiLanguageOptions}
                  value={resolvedUiLang}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="gap-0 overflow-hidden border-border/70 bg-card/95 pt-0 pb-6">
            <CardHeader className="border-b border-border/70 bg-muted/30 pt-6">
              <div className="flex items-start gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-foreground text-background shadow-sm">
                  <Globe2 className="size-5" />
                </span>
                <div>
                  <CardTitle className="font-reading text-2xl">
                    Appearance
                  </CardTitle>
                  <CardDescription className="mt-1 font-ui">
                    Keep the interface synced to your device or pin it to a
                    specific theme.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              <div className="rounded-2xl border border-border/70 bg-muted/25 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-ui text-sm font-semibold text-foreground">
                      Quick light or dark switch
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Use the toggle for fast changes, or pick a fixed mode below.
                    </p>
                  </div>
                  <ThemeToggle />
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <ThemeOptionButton
                  description="Follow your computer or phone preference automatically."
                  icon={<Monitor className="size-4" />}
                  label="System"
                  onSelect={setTheme}
                  selected={theme === "system"}
                  value="system"
                />
                <ThemeOptionButton
                  description="Keep the warmer daylight palette on every visit."
                  icon={<Sun className="size-4" />}
                  label="Light"
                  onSelect={setTheme}
                  selected={theme === "light"}
                  value="light"
                />
                <ThemeOptionButton
                  description="Use the darker contrast palette everywhere in the app."
                  icon={<Moon className="size-4" />}
                  label="Dark"
                  onSelect={setTheme}
                  selected={theme === "dark"}
                  value="dark"
                />
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
