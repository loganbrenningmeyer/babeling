"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import { Card, CardContent } from "@/components/ui/card";

import { LibraryGlossaryItem } from "@/app/(protected)/library/feature/types/glossaryItem";
import type { LangLabels } from "@/app/i18n/messages";
import { useMessages } from "@/app/hooks/useMessages";


export function RecognitionCard({
  glossaryItem,
}: {
  glossaryItem: LibraryGlossaryItem,
}) {
  const m = useMessages();
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      role="button"
      onClick={() => setFlipped((v) => !v)}
      className="mx-auto w-full max-w-xl text-left"
    >
      <div className="relative w-full aspect-[5/4] w-full [perspective:1200px]">
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
              <CardContent 
                className="
                  flex items-center justify-center text-center
                  h-full p-0 space-y-2 
                  font-reading font-semibold text-4xl
                "
              >
                {glossaryItem.definition.form}
              </CardContent>
            </Card>
          </div>

          {/* -------------------------
          //* ( Back ): Definition
          //* ------------------------- */}
          <div
            className="
              absolute inset-0 cursor-pointer
              [backface-visibility:hidden]
              [transform:rotateY(-180deg)]
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
              <CardContent 
                className="
                  flex items-center justify-center text-center
                  h-full p-0 space-y-2 
                  font-ui font-normal text-2xl
                "
              >
                {glossaryItem.definition.gloss}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  ); 
}