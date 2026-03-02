import { TableOfContents } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

import { LoadedSection } from "../../types/document"


function isCurrentSection(
  currentPageNumber: number,
  section: LoadedSection,
): boolean {
  return (
    currentPageNumber >= section.firstPageNumber && 
    currentPageNumber <= section.lastPageNumber
  );
}


export function TOCSheet({
  sections,
  currentPageNumber,
  onSelectSection,
}: {
  sections: LoadedSection[],
  currentPageNumber: number,
  onSelectSection: (section: LoadedSection) => void;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          className="
            font-ui text-muted-foreground
            border border-border
            hover:text-foreground
            hover:border-foreground/20
          "
        >
          <TableOfContents /> Contents
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        viewportTopClassName="top-32"
        showOverlay={false}
        className="
          w-[20rem] font-ui 
          border border-border
        "
      >
        <SheetHeader className="shrink-0 border-b">
          <SheetTitle 
            className="
              font-ui text-muted-foreground text-xs
              tracking-wider uppercase
            "
          >
            Table of Contents
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="grid grid-cols">
            {sections.map((section, idx) => {
              return (
                <Button 
                  key={section.id}
                  onClick={(e) => onSelectSection(section)}
                  className={`
                      w-full min-h-12 h-auto rounded-none text-foreground
                      bg-transparent
                      justify-start whitespace-normal break-words
                      text-left items-start py-3
                      hover:bg-muted-foreground/10
                      ${isCurrentSection(currentPageNumber, section) 
                        ? "bg-blue-300/20 text-blue-60 hover:bg-blue-300/20" 
                        : ""
                      }
                    `}
                  style={{
                    paddingLeft: `${1 + section.depth * 0.75}rem`
                  }}
                >
                  <span className="flex flex-col items-start">
                    <span>{section.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {section.firstPageNumber === section.lastPageNumber
                        ? `p. ${section.firstPageNumber}`
                        : `pp. ${section.firstPageNumber}-${section.lastPageNumber}`
                      }
                    </span>
                  </span>
                </Button>
              )
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
