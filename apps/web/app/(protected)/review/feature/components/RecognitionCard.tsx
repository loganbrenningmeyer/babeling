"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Info } from "lucide-react";

import { LangBadge } from "@/app/components/LangBadge";
import { Card, CardContent } from "@/components/ui/card";

import { GlossaryItemBack } from "@/app/(protected)/library/feature/components/GlossaryItemCard/GlossaryItemBack";
import { LibraryGlossaryItem } from "@/app/(protected)/library/feature/types/glossaryItem";
import { useMessages } from "@/app/hooks/useMessages";


/**************************
 * `RecognitionCard()`
 * -- Simple flashcard with word on front, definition on back
 **************************/
export function RecognitionCard({
  glossaryItem,
}: {
  glossaryItem: LibraryGlossaryItem,
}) {
  const m = useMessages();
  const [flipped, setFlipped] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  return (
    <div
      role="button"
      onClick={() => {
        setFlipped((v) => !v);
        setDetailsExpanded(false);
      }}
      className="mx-auto w-full max-w-xl text-left"
    >
      <div className="relative aspect-[4/3] w-full [perspective:1200px]">
        <motion.div
          animate={{ rotateY: flipped ? -180 : 0 }}
          transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
          className="absolute inset-0 [transform-style:preserve-3d]"
        >
          {/* -------------------------
          //* ( Front ): Target Word
          //* ------------------------- */}
          <div 
            className="
              absolute inset-0 cursor-pointer
              [backface-visibility:hidden]
            "
          >
            <Card
              className="
                relative rounded-xl h-full w-full overflow-hidden
                border bg-card p-5 shadow-sm
                transform-gpu will-change-transform
                transition duration-200 ease-out
              "
            >
              <div className="pointer-events-none absolute left-5 top-5 z-10">
                <LangBadge lang={glossaryItem.tgtLang} className="text-sm" />
              </div>
              <CardContent 
                className="
                  flex items-center justify-center text-center
                  h-full p-0 space-y-2 
                  font-reading font-semibold text-6xl
                "
              >
                {glossaryItem.definition.form}
              </CardContent>
            </Card>
          </div>

          {/* -------------------------
          //* ( Back ): Definition / Glossary Info
          //* ------------------------- */}
          <div
            className="
              absolute inset-0 cursor-pointer
              [backface-visibility:hidden]
              [transform:rotateY(-180deg)]
            "
          >
            <div className="relative h-full w-full">
              <Card
                className="
                  relative rounded-xl h-full w-full overflow-hidden
                  border bg-card p-5 shadow-sm
                  transform-gpu will-change-transform
                  transition duration-200 ease-out
                "
              >
                <CardContent className="relative h-full p-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailsExpanded(true);
                    }}
                    className="
                      absolute right-0 top-0 z-10
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

                  <div
                    className="
                      flex h-full items-center justify-center text-center
                      font-ui text-3xl font-normal
                    "
                  >
                    {glossaryItem.definition.gloss}
                  </div>
                </CardContent>
              </Card>

              <AnimatePresence>
                {detailsExpanded && (
                  <motion.div
                    className="
                      group/gloss-back
                      absolute inset-0 overflow-hidden rounded-xl
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
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  ); 
}
