import {
  GlossarySaveRequest,
  GlossarySaveRequestDTO,
  GlossarySaveResponse,
  GlossarySaveResponseDTO,
  toGlossarySaveRequestDTO,
  GlossaryLoadResponse,
  GlossaryLoadResponseDTO,
  GlossaryDeleteResponse,
  GlossaryDeleteResponseDTO,
  fromGlossarySaveResponseDTO,
  fromGlossaryLoadResponseDTO,
  fromGlossaryDeleteResponseDTO,
} from "../types/glossaryItem";


/**************************
 * `saveGlossaryItem()`
 * -- POST: /api/glossary_items
 * -- Saves annotation information to database as glossary_item
 **************************/
export async function saveGlossaryItem(args: GlossarySaveRequest): Promise<GlossarySaveResponse> {
  const body: GlossarySaveRequestDTO = toGlossarySaveRequestDTO(args);

  const res = await fetch("/api/glossary_items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "Failed to save glossary item");
  }

  const data = (await res.json()) as GlossarySaveResponseDTO;
  return fromGlossarySaveResponseDTO(data);
}


/**************************
 * `loadGlossaryItem()`
 * -- GET: /api/glossary_items/[glossary_item_id]
 * -- Load glossary_item data from database
 **************************/
export async function loadGlossaryItem(glossary_item_id: number): Promise<GlossaryLoadResponse> {
  const res = await fetch(`/api/glossary_items/${glossary_item_id}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "Failed to load glossary item");
  }

  const data = (await res.json()) as GlossaryLoadResponseDTO;
  return fromGlossaryLoadResponseDTO(data);
}


/**************************
 * `deleteGlossaryItem()`
 * -- DELETE: /api/glossary_items/[glossary_item_id]
 * -- Delete glossary_item data from database by ID
 **************************/
export async function deleteGlossaryItem(glossary_item_id: number): Promise<GlossaryDeleteResponse> {
  const res = await fetch(`/api/glossary_items/${glossary_item_id}`, {
    method: "DELETE",
    cache: "no-store",
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "Failed to delete glossary item");
  }

  const data = (await res.json()) as GlossaryDeleteResponseDTO;
  return fromGlossaryDeleteResponseDTO(data);
}