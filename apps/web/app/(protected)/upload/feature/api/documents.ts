
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
  token: string;
}): Promise<{ documentId: number }> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not set");
  }

  const fd = new FormData();
  fd.append("title", args.title);
  fd.append("src_lang", args.srcLang);
  fd.append("file", args.file);

  const res = await fetch(`${apiBaseUrl}/documents/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.token}`,
    },
    body: fd,
  });

  const text = await res.text();
  let payload: { document_id?: number; detail?: string; error?: string } | null = null;

  try {
    payload = JSON.parse(text) as { document_id?: number; detail?: string; error?: string };
  } catch {
    payload = null;
  }

  if (!res.ok) {
    throw new Error(
      payload?.detail ||
      payload?.error ||
      text ||
      "Failed to save document",
    );
  }

  const data =
    payload && typeof payload.document_id === "number"
      ? payload as { document_id: number }
      : JSON.parse(text) as { document_id: number };

  return { documentId: data.document_id };
}
