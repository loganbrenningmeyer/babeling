import ReaderPageClient from "./ReaderPageClient";

export default async function ReaderPage({
  params,
  searchParams,
}: {
  params: Promise<{ documentId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { documentId } = await params;
  const sp = await searchParams;

  return (
    <div className="fixed inset-x-0 bottom-0 top-[65px] overflow-hidden bg-background">
      <ReaderPageClient documentId={documentId} searchParams={sp} />
    </div>
  );
}
