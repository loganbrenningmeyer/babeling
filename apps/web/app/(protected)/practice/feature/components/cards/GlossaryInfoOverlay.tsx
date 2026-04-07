"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Info } from "lucide-react";

import { GlossaryItemBack } from "@/app/(protected)/library/feature/components/GlossaryItemCard/GlossaryItemBack";
import type { LibraryGlossaryItem } from "@/app/(protected)/library/feature/types/glossaryItem";
import { useMessages } from "@/app/hooks/useMessages";
import type { PracticeItem } from "../../types/practiceItem";

export function GlossaryInfoOverlay({
  practiceItem,
  enabled,
}: {
  practiceItem: PracticeItem;
  enabled: boolean;
}) {
  const m = useMessages();
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const glossaryItem: LibraryGlossaryItem = {
    glossaryItemId: practiceItem.savedGlossaryItemId ?? -1,
    documentTitle: practiceItem.documentTitle,
    srcLang: practiceItem.srcLang,
    tgtLang: practiceItem.tgtLang,
    definition: practiceItem.definition,
    usage: practiceItem.usage,
    createdAt: "",
  };

  useEffect(() => {
    if (!enabled) {
      setDetailsExpanded(false);
    }
  }, [enabled]);

  return (
    <>
      {enabled && !detailsExpanded && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setDetailsExpanded(true);
          }}
          className="
            absolute right-5 top-5 z-10
            inline-flex h-7 w-7 items-center justify-center
            rounded-full border border-border/70 bg-background/80
            font-ui text-sm font-semibold text-muted-foreground
            transition-colors duration-150
            hover:bg-background hover:text-foreground
          "
          aria-label={m.library.glossary}
        >
          <Info className="h-5 w-5" />
        </button>
      )}

      <AnimatePresence>
        {detailsExpanded && (
          <motion.div
            className="
              group/gloss-back
              absolute inset-0 z-20 overflow-hidden rounded-xl
            "
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <GlossaryItemBack
              glossaryItem={glossaryItem}
              langLabels={m.langs}
              onClose={() => setDetailsExpanded(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
