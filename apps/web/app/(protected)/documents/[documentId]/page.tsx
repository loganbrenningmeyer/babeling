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
    <div className="mx-auto h-[calc(100dvh-4rem)] w-full overflow-hidden">
      <ReaderPageClient
        documentId={documentId}
        searchParams={sp}
      />
    </div>
  )
}