
/**************************
 * `createTextDocument()`
 * -- POST: /api/documents
 *    Saves new Document to database and returns its document ID
 **************************/
export async function createTextDocument(args: {
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


/**************************
 * `createFileDocument()`
 * -- POST: /api/documents/upload
 *    Saves new Document from given file and returns its document ID
 **************************/
export async function createFileDocument(args: {
  title: string;
  srcLang: string;
  file: File;
}): Promise<{ documentId: number }> {
  // Create FormData
  const fd = new FormData();
  fd.append("title", args.title);
  fd.append("src_lang", args.srcLang);
  fd.append("file", args.file);

  const res = await fetch("/api/documents/upload", {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    throw new Error("Failed to save document");
  }

  const data = await res.json();

  return { documentId: data.document_id };
}
