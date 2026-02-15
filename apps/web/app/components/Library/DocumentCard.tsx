import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LibraryDocument } from "@/types/library";

function formatDate(value: string | null) {
  if (!value) return "Unknown date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getTitle(text: string) {
  const compact = text.replace(/\s+/g, " ").trim();
  if (!compact) return "Untitled document";
  return compact.length > 64 ? `${compact.slice(0, 64)}...` : compact;
}

function getPreview(text: string) {
  const compact = text.replace(/\s+/g, " ").trim();
  if (!compact) return "No preview available.";
  return compact.length > 180 ? `${compact.slice(0, 180)}...` : compact;
}

export function DocumentCard({ doc }: { doc: LibraryDocument }) {
  return (
    <Card className="h-full gap-3 py-4">
      <CardHeader className="px-4">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="line-clamp-2 text-base">
            {getTitle(doc.source_text)}
          </CardTitle>
          <span className="rounded-md border px-2 py-0.5 text-xs font-semibold text-muted-foreground">
            #{doc.id}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {formatDate(doc.created_at)}
        </p>
      </CardHeader>

      <CardContent className="px-4">
        <p className="line-clamp-5 text-sm leading-6 text-muted-foreground">
          {getPreview(doc.source_text)}
        </p>
      </CardContent>
    </Card>
  );
}
