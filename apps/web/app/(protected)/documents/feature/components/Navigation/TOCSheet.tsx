import { TableOfContents } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"


export function TOCSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="font-ui">
          <TableOfContents /> Contents
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[20rem] font-ui">
        <SheetHeader>
          <SheetTitle>Table of Contents</SheetTitle>
        </SheetHeader>

        <div className="mt-4">
          {/* Your TOC / settings / filters here */}
        </div>
      </SheetContent>
    </Sheet>
  )
}