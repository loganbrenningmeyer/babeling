"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoveRight } from "lucide-react";
import { LangBadge } from "./LangBadge";

import { LibraryTranslation } from "../../types/translation";
import { truncate, capitalizeWords } from "@/lib/string";


export function TranslationsBack({
  title,
  srcLang,
  translations,
  loading,
  error,
}: {
  title: string,
  srcLang: string,
  translations: LibraryTranslation[],
  loading: boolean,
  error: string | null,
}) {
  const first = translations[0];

  const content = (() => {
    if (loading) {
      return (
        <p className="font-ui text-sm text-muted-foreground">
          Loading translations...
        </p>
      );
    }

    if (error) {
      return (
        <p className="font-ui text-sm text-destructive">
          Failed to load translations
        </p>
      );
    }

    if (!first) {
      return (
        <p className="font-ui text-sm text-muted-foreground">
          No translations yet
        </p>
      );
    }

    return (
      <>
        {/* -------------------------
        * Title + Source Language Badge
        * ------------------------- */}
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-reading font-medium leading-tight">
            {capitalizeWords(title)}
          </h2>
          <span className="flex inline-flex items-center gap-1">
            <LangBadge lang={srcLang}/>
            <MoveRight size={12} />
            <LangBadge lang={first.tgtLang}/>
          </span>
        </div>
        {/* -------------------------
        * Author + Text Sample
        * ------------------------- */}
        <div className="flex">
          <p className="
            font-reading text-sm italic
            text-muted-foreground leading-relaxed line-clamp-3
          ">
            "{truncate(first.tgtText, 100)}…"
          </p>
        </div>
      </>
    );
  })();

  return (
    <div className="absolute inset-0 rounded-3xl [transform:rotateY(180deg)] [backface-visibility:hidden]">
      <Card className="h-full w-full rounded-3xl border bg-card p-5 shadow-sm">
        <CardContent className="h-full p-0 space-y-4 flex flex-col">
          {content}
        </CardContent>
      </Card>
    </div>
  )
}
