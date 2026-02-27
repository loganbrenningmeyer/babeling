"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { DocumentFront } from "./DocumentFront";
import { DocumentBack } from "./DocumentBack";

import { LibraryDocument } from "../../types/document";
import { useRecentTranslations } from "../../hooks/useRecentTranslations";
import { getMostRecentTranslation } from "../../utils/translations";


export function DocumentFlipCard({
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
      className="w-full max-w-sm justify-self-start text-left"
    >
      <div className="relative aspect-[4/3] w-full [perspective:800px]">
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
          className="absolute inset-0 [transform-style:preserve-3d]"
        >
          {/* -------------------------
          * ( Front ): Document Info
          * ------------------------- */}
          <div className="absolute inset-0 [backface-visibility:hidden] cursor-pointer">
            <div className={`h-full w-full ${flipped ? "" : "group/doc-card"}`}>
              <DocumentFront 
                document={document}
                recentTranslation={recentTranslation}
                translationsLoading={translationsLoading}
                />
            </div>
          </div>
          {/* -------------------------
          * ( Back ): Translations Info
          * ------------------------- */}
          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div className="h-full w-full">
              <DocumentBack 
                document={document}
                translations={translations}
                loading={translationsLoading}
                error={translationsError}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
