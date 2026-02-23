/**************************
 * `createDocument()`
 * -- POST: /api/documents
 *    Saves new Document to database and returns its document ID
 **************************/
export async function createDocument(args: {
  title: string;
  srcLang: string;
  text: string;
}): Promise<{ documentId: number }> {
  const res = await fetch("/api/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: args.title,
      src_lang: args.srcLang,
      text: args.text,
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to save document");
  }

  const data = await res.json();

  return { documentId: data.document_id };
}



