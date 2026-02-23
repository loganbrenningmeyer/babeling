import ReaderPageClient from "./ReaderPageClient";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ documentId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { documentId } = await params;
  const sp = await searchParams;

  return <ReaderPageClient documentId={documentId} searchParams={sp} />;
}