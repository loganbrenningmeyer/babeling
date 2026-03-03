import { cn } from "@/lib/utils";
import { Download } from "lucide-react";

import { Separator } from "@/components/ui/separator";

import { LangBadge } from "@/app/components/LangBadge";

import type { GutendexBook } from "../../types/gutendex";


export function BookCard({
  book,
  selected,
  onClick,
}: {
  book: GutendexBook;
  selected?: boolean;
  onClick: (book: GutendexBook) => void;
}) {
  return (
    <div
      className={cn(
        "flex flex-col aspect-[21/10] gap-4",
        "p-4 rounded-sm overflow-hidden cursor-pointer",
        "border transition-[border-color,box-shadow,transform] duration-200 ease-out",
        "hover:-translate-y-0.5",
        selected
          ? "bg-blue-50 border-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.18)]"
          : "bg-zinc-50 border-zinc-500/60",
      )}
      onClick={() => onClick(book)}
    >
      {/* -------------------------
      * Title / Author
      * ------------------------- */}
      <div className="flex flex-col">
        <div className="font-reading font-bold text-foreground text-lg line-clamp-2">
          {book.title}
        </div>
        <div className="font-ui text-muted-foreground text-md">
          {book.authors[0]}
        </div>
      </div>

      {/* -------------------------
      * Language / Downloads
      * ------------------------- */}
      <div className="mt-auto flex flex-col gap-4">  
        <Separator />

        <div className="inline-flex items-center justify-between">
          <div className="flex flex-row gap-1">
            {/* Languages */}
            {book.languages.map((lang) => (
              <LangBadge 
                key={lang}
                lang={lang}
                className="h-6" 
              />
            ))}
          </div>
          {/* Downloads */}
          <div className="inline-flex items-center gap-2">
            <Download className="h-3 w-3"/>
            <span className="font-ui text-sm text-muted-foreground">
              {book.downloadCount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
