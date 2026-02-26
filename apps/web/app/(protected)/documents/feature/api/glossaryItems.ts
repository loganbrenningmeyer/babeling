import {
  GlossaryItemSaveRequest,
  GlossaryItemSaveRequestDTO,
  GlossaryItemSaveResponse,
  GlossaryItemSaveResponseDTO,
  toGlossaryItemSaveRequestDTO,
  GlossaryItemLoadResponse,
  GlossaryItemLoadResponseDTO,
  GlossaryItemsLoadResponse,
  GlossaryItemsLoadResponseDTO,
  GlossaryItemDeleteResponse,
  GlossaryItemDeleteResponseDTO,
  fromGlossaryItemSaveResponseDTO,
  fromGlossaryItemLoadResponseDTO,
  fromGlossaryItemDeleteResponseDTO,
  fromGlossaryItemsLoadResponseDTO,
} from "../types/glossaryItem";


/**************************
 * `saveGlossaryItem()`
 * -- POST: /api/glossary_items
 * -- Saves annotation information to database as glossary_item
 **************************/
export async function saveGlossaryItem(args: GlossaryItemSaveRequest): Promise<GlossaryItemSaveResponse> {
  const body: GlossaryItemSaveRequestDTO = toGlossaryItemSaveRequestDTO(args);

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

  const data = (await res.json()) as GlossaryItemSaveResponseDTO;
  return fromGlossaryItemSaveResponseDTO(data);
}


/**************************
 * `loadGlossaryItem()`
 * -- GET: /api/glossary_items/[glossary_item_id]
 * -- Load glossary_item data from database
 **************************/
export async function loadGlossaryItem(glossary_item_id: number): Promise<GlossaryItemLoadResponse> {
  const res = await fetch(`/api/glossary_items/${glossary_item_id}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "Failed to load glossary item");
  }

  const data = (await res.json()) as GlossaryItemLoadResponseDTO;
  return fromGlossaryItemLoadResponseDTO(data);
}


/**************************
 * `loadGlossaryItems()`
 * -- Gets all glossary items from user's library
 **************************/
export async function loadGlossaryItems(): Promise<GlossaryItemsLoadResponse> {
  const res = await fetch("/api/glossary_items", {
    method: "GET",
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error("Failed to load recent documents");
  }

  const { glossaryItems } = fromGlossaryItemsLoadResponseDTO(
    data as GlossaryItemsLoadResponseDTO
  );

  return { glossaryItems };
}


/**************************
 * `deleteGlossaryItem()`
 * -- DELETE: /api/glossary_items/[glossary_item_id]
 * -- Delete glossary_item data from database by ID
 **************************/
export async function deleteGlossaryItem(glossary_item_id: number): Promise<GlossaryItemDeleteResponse> {
  const res = await fetch(`/api/glossary_items/${glossary_item_id}`, {
    method: "DELETE",
    cache: "no-store",
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "Failed to delete glossary item");
  }

  const data = (await res.json()) as GlossaryItemDeleteResponseDTO;
  return fromGlossaryItemDeleteResponseDTO(data);
}