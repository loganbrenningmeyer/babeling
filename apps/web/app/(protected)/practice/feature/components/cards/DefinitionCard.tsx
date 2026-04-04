"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RotateCw } from "lucide-react";

import { LangBadge } from "@/app/components/LangBadge";
import { Card, CardContent } from "@/components/ui/card";

import { LibraryGlossaryItem } from "@/app/(protected)/library/feature/types/glossaryItem";
import { GlossaryInfoOverlay } from "./GlossaryInfoOverlay";


/**************************
 * `DefinitionCard()`
 * -- Simple flashcard with word on front, definition on back
 **************************/
export function DefinitionCard({
  glossaryItem,
}: {
  glossaryItem: LibraryGlossaryItem,
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      role="button"
      onClick={() => {
        setFlipped((v) => !v);
      }}
      className="mx-auto w-full max-w-xl text-left"
    >
      <div className="relative aspect-[4/3] w-full [perspective:1400px]">
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
                  border bg-card p-5 shadow-sm
                  transition duration-200 ease-out
                "
              >
                <div className="pointer-events-none absolute left-5 top-5 z-10">
                  <LangBadge lang={glossaryItem.tgtLang} className="text-sm" />
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
                    font-reading font-semibold text-6xl
                  "
                >
                  {glossaryItem.definition.form}
                </CardContent>
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
                  border bg-card p-5 shadow-sm
                  transition duration-200 ease-out
                "
              >
                <CardContent className="relative h-full p-0">
                  <div
                    className="
                      flex h-full items-center justify-center text-center
                      font-ui text-3xl font-normal
                    "
                  >
                    {glossaryItem.definition.gloss}
                  </div>
                </CardContent>
                <GlossaryInfoOverlay glossaryItem={glossaryItem} enabled={true} />
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  ); 
}
