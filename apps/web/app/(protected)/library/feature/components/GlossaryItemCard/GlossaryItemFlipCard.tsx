"use client";

import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

import { GlossaryItemFront } from "./GlossaryItemFront";
import { GlossaryItemBack } from "./GlossaryItemBack";

import { LibraryGlossaryItem } from "../../types/glossaryItem";


export function GlossaryItemFlipCard({
  glossaryItem,
}: {
  glossaryItem: LibraryGlossaryItem,
}) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const openCard = useCallback(() => {
    setOpen(true);
  }, []);

  const closeCard = useCallback(() => {
    if (closing) return;
    setClosing(true);
    setOpen(false);
  }, [closing]);

  const layoutId = `glossary-${glossaryItem.glossaryItemId}`;

  const CardBody = ({ side }: { side: "front" | "back" }) => (
    <div className="
      relative aspect-[3/2] w-full 
      cursor-pointer
    ">
      <div className="absolute inset-0">
        { side === "front" ? (
          <GlossaryItemFront glossaryItem={glossaryItem} />
        ) : (
          <GlossaryItemBack glossaryItem={glossaryItem} />
        )}
      </div>
    </div>
  );
  
  return (
    <>
      {/* -------------------------
      //* ( Front - Grid ): Definition Info
      //* ------------------------- */}
      <motion.div
        layoutId={layoutId}
        layout
        animate={{ opacity: open ? 0 : 1 }}
        onLayoutAnimationComplete={() => {
          if (!open) setClosing(false);
        }}
        transition={{
          layout: { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] },
          opacity: { duration: 0 },
        }}
        className={
          `relative w-full text-left [perspective:800px] ${
            open || closing ? "z-[60]" : "z-0"
          }`
        }
      >
        <button
          type="button"
          onClick={openCard}
          className="group block w-full text-left"
        >
          {CardBody({ side: "front" })}
        </button>
      </motion.div>

      {/* -------------------------
      //* ( Back - Popout ): Usage Info
      //* ------------------------- */}
      {typeof window !== "undefined" &&
        createPortal(
          <>
            <AnimatePresence>
              {open && (
                <motion.button
                  type="button"
                  aria-label="Close"
                  className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]"
                  onClick={closeCard}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {open && (
                <div className="fixed inset-0 z-50 grid place-items-center p-4 pointer-events-none">
                  <motion.div
                    layoutId={layoutId}
                    layout
                    transition={{ 
                      layout: { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] },
                      opacity: { duration: 0 },
                    }}
                    className="pointer-events-auto w-full max-w-3xl cursor-default drop-shadow-2xl [perspective:800px]"
                  >
                    {CardBody({ side: "back" })}
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </>,
          document.body
        )}
    </>
  )
}
