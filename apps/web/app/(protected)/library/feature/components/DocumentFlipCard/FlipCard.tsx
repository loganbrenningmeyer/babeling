"use client";

import { useMemo, useState } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { MoveRight } from "lucide-react";

import { DocumentFront } from "./DocumentFront";
import { TranslationsBack } from "./TranslationsBack";

import { LibraryDocument } from "../../types/document";
import { LibraryTranslation } from "../../types/translation";

import { useRecentTranslations } from "../../hooks/useRecentTranslations";
import { getMostRecentTranslation } from "../../utils/translations";


export function FlipCard({
  document,
}: {
  document: LibraryDocument,
}) {
  const [flipped, setFlipped] = useState(false);

  const {
    translations,
    loading: translationsLoading,
    error: translationsError,
  } = useRecentTranslations({
    documentId: document.id,
  });

  // -------------------------
  // Determine most recently opened translation
  // -------------------------
  const recentTranslation = getMostRecentTranslation(translations);

  return (
    <div
      role="button"
      onClick={() => setFlipped((v) => !v)}
      className="inline-block text-left cursor-pointer"
    >
      <div className="relative aspect-square [perspective:800px]">
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
          className="absolute inset-0 rounded-3xl [transform-style:preserve-3d]"
        >
          {/* -------------------------
          * ( Front ): Document Info
          * ------------------------- */}
          <DocumentFront 
            document={document}
            recentTranslation={recentTranslation}
            translationsLoading={translationsLoading}
          />
          {/* -------------------------
          * ( Back ): Translations Info
          * ------------------------- */}
          <TranslationsBack 
            title={document.title}
            srcLang={document.srcLang}
            translations={translations}
            loading={translationsLoading}
            error={translationsError}
          />
        </motion.div>
      </div>
    </div>
  )
}
