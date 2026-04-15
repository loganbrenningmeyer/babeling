"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RotateCw } from "lucide-react";

import { LangBadge } from "@/app/components/LangBadge";
import { Card, CardContent } from "@/components/ui/card";

import { GlossaryInfoOverlay } from "./GlossaryInfoOverlay";
import type { PracticeItem } from "../../types/practiceItem";


/**************************
 * `DefinitionCard()`
 * -- Simple flashcard with word on front, definition on back
 **************************/
export function DefinitionCard({
  practiceItem,
}: {
  practiceItem: PracticeItem,
}) {
  const [flipped, setFlipped] = useState(false);
  const showInfoFromStart = practiceItem.source === "page";

  return (
    <div
      role="button"
      onClick={() => {
        setFlipped((v) => !v);
      }}
      className="mx-auto w-full max-w-xl text-left"
    >
      <div className="relative h-[min(62vh,31rem)] min-h-[24rem] w-full [perspective:1400px] sm:aspect-[4/3] sm:h-auto sm:min-h-0">
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
            <div className={`h-full w-full ${flipped ? "" : "group/definition-front"}`}>
              <Card
                className="
                  relative rounded-xl h-full w-full
                  border bg-card p-4 shadow-sm sm:p-5
                  transition duration-200 ease-out
                "
              >
                <div className="pointer-events-none absolute left-4 top-4 z-10 sm:left-5 sm:top-5">
                  <LangBadge lang={practiceItem.tgtLang} className="text-xs sm:text-sm" />
                </div>
                <div
                  className="
                    pointer-events-none absolute bottom-5 right-5
                    text-muted-foreground
                    opacity-0 group-hover/definition-front:opacity-60
                    transition-opacity duration-150
                    select-none
                  "
                  aria-hidden="true"
                >
                  <RotateCw
                    className="
                      h-4 w-4
                      transition-transform duration-300 ease-out
                      group-hover/definition-front:rotate-180
                    "
                  />
                </div>
                <CardContent 
                  className="
                    flex items-center justify-center text-center
                    h-full p-0 space-y-2 
                    break-words font-reading text-4xl font-semibold sm:text-6xl
                  "
                >
                  {practiceItem.definition.form}
                </CardContent>
                <GlossaryInfoOverlay
                  practiceItem={practiceItem}
                  enabled={showInfoFromStart}
                />
              </Card>
            </div>
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
                  relative rounded-xl h-full w-full
                  border bg-card p-4 shadow-sm sm:p-5
                  transition duration-200 ease-out
                "
              >
                <CardContent className="relative h-full overflow-y-auto p-0">
                  <div
                    className="
                      flex min-h-full items-center justify-center text-center
                      font-ui text-xl font-normal leading-7 sm:text-3xl sm:leading-normal
                    "
                  >
                    {practiceItem.definition.gloss}
                  </div>
                </CardContent>
                <GlossaryInfoOverlay practiceItem={practiceItem} enabled={true} />
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  ); 
}
