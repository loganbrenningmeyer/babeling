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
        <Button variant="outline" className="font-ui">
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
        <SheetHeader>
          <SheetTitle 
            className="
              font-ui text-muted-foreground text-xs
              tracking-wider uppercase
            "
          >
            Table of Contents
          </SheetTitle>
        </SheetHeader>

        <div className="grid grid-cols">
          {sections.map((section, idx) => {
            return (
              <Button 
                key={section.id}
                onClick={(e) => onSelectSection(section)}
                className="
                  w-full h-12 rounded-none text-foreground
                  bg-transparent border border-border
                  justify-start
                  hover:bg-muted-foreground/10
                "
              >
                {section.title}
              </Button>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}
