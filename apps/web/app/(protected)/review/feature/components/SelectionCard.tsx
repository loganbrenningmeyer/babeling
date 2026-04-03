"use client";

import { LibraryGlossaryItem } from "@/app/(protected)/library/feature/types/glossaryItem";
import { useMessages } from "@/app/hooks/useMessages";


/**************************
 * `SelectionCard()`
 * -- Given a source sentence with highlighted word, 
 * select the proper target word 
 **************************/
export function SelectionCard({
  glossaryItem,
}: {
  glossaryItem: LibraryGlossaryItem,
}) {
  const m = useMessages();

  return (
    <div>
      
    </div>
  )
}