import io
import itertools
import zipfile
from ebooklib import epub, ITEM_COVER, ITEM_IMAGE, ITEM_DOCUMENT
from ebooklib.epub import EpubBook, EpubItem, Link
from pathlib import Path, PurePosixPath
from bs4 import BeautifulSoup, Tag
from urllib.parse import unquote

from .document import EpubBlock, EpubImage, EpubSection, EpubDocument


# -------------------------
# Block-level HTML tags
# -------------------------
BLOCK_TAGS = {
    "p",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "li",
    "blockquote",
    "pre",
}


def norm_path(p: str) -> str:
    """
    Normalizes EPUB internal paths (POSIX-style /) separators
    to avoid using OS-specific path separators (e.g., Windows \)
    """
    return str(PurePosixPath(p))


def resolve_src(doc_path: str, src: str) -> str:
    """
    Converts a document-relative path to an absolute path

    Params:
        doc_path (str): Document .get_name(), e.g., "OEBPS/part0001.xhtml"
        src (str): HTML src filename, e.g., "image67.jpg" or maybe "image67.jpg#something" / "image67.jpg?version=2"
    
    Returns:
        (str): Absolute path to src
    """
    # -- Strip fragment / query and decode
    src = src.split("#", 1)[0].split("?", 1)[0]
    src = unquote(src)

    # -- Resolve relative path to document directory (e.g., "OEBPS/doc.xhtml" -> "OEBPS")
    base_dir = PurePosixPath(norm_path(doc_path)).parent

    # -- Rooted at EPUB root ("/OEBPS/image67.jpg")
    if src.startswith("/"):
        return norm_path(src.lstrip("/"))
    # -- Relative path, connect to base_dir ("OEBPS/" + "image67.jpg")
    else:
        return norm_path(str(base_dir / src))


def is_texty_leaf_div(el: Tag) -> bool:
    """
    Verifies if a <div> element contains purely text, acting as a paragraph block
    """
    # only for divs
    if el.name != "div":
        return False

    # must have some text
    txt = el.get_text(" ", strip=True)
    if not txt:
        return False

    # ignore divs that mostly contain other structural blocks (avoid duplicates)
    # if it contains any <p>, <li>, <blockquote>, <pre>, or headings, skip it
    if el.find(BLOCK_TAGS):
        return False

    # ignore divs that are basically image containers
    if el.find("img") and len(txt) < 40:
        return False

    return True


class EpubParser:
    """
    EPUB File Contents:
    - OPF package file (content.opf)
        - <metadata>: DC + OPF meta data, e.g., title, creator, language
        - <manifest>: List of all files with IDs
            - <item href="<filepath>" id="<entry name>" ... />
        - <spine>: Reading order, list of manifest IDs
            - <itemref idref="<manifest id>" />
    - Navigation (toc.ncx / toc.xhtml / nav.xhtml)
        - Provides chapter boundaries / titles
    - Content Documents
        - XHTML files (e.g., part0001.xhtml, ...-h-0.xhtml, etc.)
    - Resources
        - Images, CSS, fonts, etc.
    """

    def __init__(self):
        pass

    def build_document(
        self, 
        *,
        epub_bytes: bytes | None = None, 
        epub_path: str | Path | None = None
    ) -> EpubDocument | None:
        """
        1) Read EPUB with ebooklib
        2) Use EpubParser to extract normalized sections/blocks
        3) Builds EpubDocument dataclass
        """
        if epub_bytes:
            book: EpubBook = epub.read_epub(io.BytesIO(epub_bytes))
        elif epub_path:
            book: EpubBook = epub.read_epub(epub_path)
        else:
            return None
        
        # -------------------------
        # Metadata (DC)
        # -------------------------
        title = self.get_metadata(book, "title")
        author = self.get_metadata(book, "creator")
        language = self.get_metadata(book, "language")

        # -------------------------
        # Cover Image (bytes, media type)
        # -------------------------
        cover_image_data = self.get_cover_image(book)
        if cover_image_data:
            cover_bytes, cover_media_type = cover_image_data
        else:
            cover_bytes, cover_media_type = None, None

        # -------------------------
        # Extract content sections / images
        # -------------------------
        raw_sections, raw_images = self.get_sections(book)

        # -------------------------
        # Convert images into EpubImage objects
        # -- Only store links to images, load lazily to save memory
        # -------------------------
        images = {}
        for image_key, data in raw_images.items():
            payload = data.get("bytes")
            images[image_key] = EpubImage(
                image_key=image_key,
                href=data["href"],
                media_type=data.get("media_type"),
                byte_length=len(payload) if payload is not None else 0,
                data=payload,
            )

        # -------------------------
        # Convert section blocks into typed EpubBlock objects
        # -------------------------
        sections: list[EpubSection] = []
        for s in raw_sections:
            epub_blocks: list[EpubBlock] = []

            for b in (s.get("blocks") or []):
                # -- Text
                if b["type"] == "text":
                    text = (b.get("text") or "").strip()
                    if not text:
                        continue
                    epub_blocks.append(
                        EpubBlock(
                            type="text",
                            tag=b["tag"],
                            text=text,
                        )
                    )

                # -- Images
                elif b["type"] == "image":
                    image_key = b.get("image_key")
                    if not image_key:
                        continue
                    epub_blocks.append(
                        EpubBlock(
                            type="image",
                            image_key=image_key,
                            alt=b.get("alt"),
                        )
                    )

            sections.append(
                EpubSection(
                    title=s["title"],
                    path=s["path"],
                    fragment=s.get("fragment"),
                    spine_id=s["spine_id"],
                    blocks=tuple(epub_blocks),
                    parent_title=s.get("parent_title"),
                    parent_key=s.get("parent_key"),
                )
            )

        return EpubDocument(
            title=title,
            author=author,
            language=language,
            cover_bytes=cover_bytes,
            cover_media_type=cover_media_type,
            sections=sections,
            images=images,
        )

    def build_id_to_item(self, book: EpubBook) -> dict[str, EpubItem]:
        """
        Returns dictionary of all EPUB XHTML content files (ITEM_DOCUMENT)
        keyed by their manifest IDs
        """
        id_to_item = {
            item.get_id(): item for item in book.get_items_of_type(ITEM_DOCUMENT)
        }
        return id_to_item

    def get_doc_by_path(self, book: EpubBook, path: str) -> EpubItem | None:
        """
        Finds and returns the XHTML item whose internal name matches a TOC path
        """
        path = norm_path(path.lstrip("/"))

        # -- Attempt direct retrieval via EpubBook
        direct = book.get_item_with_href(path)
        if direct is not None and direct.get_type() == ITEM_DOCUMENT:
            return direct

        suffix = "/" + path
        for item in book.get_items_of_type(ITEM_DOCUMENT):
            name = norm_path(item.get_name())
            if name == path or name.endswith(suffix):
                return item

        return None
    
    def get_item_by_href(self, book: EpubBook, href: str) -> EpubItem | None:
        """
        Given the path (href) to an item in the EpubBook, returns the
        item by matching the href to the book items' names
        """
        href = norm_path(href.lstrip("/"))

        # -- Attempt direct retrieval via EpubBook
        direct = book.get_item_with_href(href)
        if direct is not None:
            return direct
        
        # -- Primary: Find exact match in book items
        for item in book.get_items():
            if norm_path(item.get_name()) == href:
                return item

        # -- Narrow fallback: Folder boundary match only
        suffix = "/" + href
        for item in book.get_items():
            if norm_path(item.get_name()).endswith(suffix):
                return item
            
        return None

    def get_metadata(self, book: EpubBook, label: str) -> str | None:
        """
        Given a label (e.g., "creator", "title", "language", etc.) returns the
        metadata from content.opf if found, otherwise None
        """
        try:
            meta = book.get_metadata("DC", label)[0][0]
        except:
            meta = None
        return meta

    def flatten_toc(self, toc, depth: int = 0, parent_key: str | None = None, parent_title: str | None = None) -> list[dict]:
        """
        Flattens nested TOC structure (Link, Section -> [Link1, Link2], etc.)
        into a list of Link dicts with depth / parent title information
        """
        out: list[dict] = []

        for item in toc:
            # -------------------------
            # 1) Section -> Children
            # -------------------------
            if isinstance(item, tuple):
                section, children = item
                section_title = getattr(section, "title", None) or parent_title
                section_href = getattr(section, "href", None)
                next_parent_key = self._href_to_key(section_href) if section_href else parent_key
                out.extend(self.flatten_toc(children, depth + 1, next_parent_key, section_title))
                continue

            # -------------------------
            # 2) Isolated Link
            # -------------------------
            if isinstance(item, Link):
                out.append({
                    "link": item,
                    "key": self._href_to_key(item.href),
                    "parent_key": parent_key,
                    "depth": depth,
                    "parent_title": parent_title,
                })
                continue

            # -------------------------
            # Handle EpubHtml entries that may appear directly in TOC
            # -------------------------
            if hasattr(item, "get_name"):
                href = item.get_name()
                pseudo = Link(href, getattr(item, "title", ""), getattr(item, "id", ""))
                out.append({
                    "link": pseudo,
                    "key": self._href_to_key(href),
                    "parent_key": parent_key,
                    "depth": depth,
                    "parent_title": parent_title,
                })

        return out

    def get_cover_image(self, book: EpubBook) -> tuple[bytes, str] | None:
        """
        Returns the EPUB cover image as bytes / media type string if found, otherwise None
        """
        # -------------------------
        # 1) Preferred: OPF metadata
        # -------------------------
        for value, attrs in book.get_metadata("OPF", "cover"):
            cover_id = (attrs or {}).get("content")
            if not cover_id:
                continue
            item = book.get_item_with_id(cover_id)
            if item is not None:
                return item.get_content(), getattr(item, "media_type", None)
            
        # -------------------------
        # 2) Fallback: Explicity cover-type items
        # -------------------------
        for item in book.get_items_of_type(ITEM_COVER):
            return item.get_content(), getattr(item, "media_type", None)
        
        # -------------------------
        # 3) Last resort: Filename heuristic
        # -------------------------
        for item in book.get_items_of_type(ITEM_IMAGE):
            name = norm_path(item.get_name()).lower()
            if name.rsplit("/", 1)[-1].startswith("cover") or "/cover" in name:
                return item.get_content(), getattr(item, "media_type", None)
            
        return None

    def get_entries_by_spine_id(self, book: EpubBook, spine_id: str) -> list[dict]:
        """ """
        # -------------------------
        # Resolve spine_id in { manifest ID -> ITEM_DOCUMENT }
        # -------------------------
        id_to_item = self.build_id_to_item(book)
        if spine_id not in id_to_item:
            return []

        # -------------------------
        # Get ITEM_DOCUMENT and name (internal href-like path)
        # -------------------------
        doc = id_to_item[spine_id]
        filename = doc.get_name()

        # -- Flatten TOC into ordered list of Links
        toc_links = self.flatten_toc(book.toc)

        # -------------------------
        # Get all TOC entries that correspond to the spine_id
        # -------------------------
        matches = []
        for row in toc_links:
            link: Link = row["link"]

            # -------------------------
            # Internal TOC href path, e.g., "...xhtml#pubid00000"
            # -- link_filename: "...xhtml"
            # -- sep:           "#"
            # -- fragment:      "pubid00000"
            # -------------------------
            href = link.href
            link_filename, sep, fragment = href.partition("#")

            # -------------------------
            # Verify that link href filename matches spine_id's document filename
            # -------------------------
            if norm_path(link_filename).endswith(norm_path(filename)):
                matches.append(
                    {
                        "title": link.title,
                        "path": link_filename,
                        "fragment": fragment if sep else None,
                        "depth": row["depth"],
                        "parent_title": row["parent_title"],
                        "parent_key": row["parent_key"],
                    }
                )

        return matches

    def build_spine_entries(self, book: EpubBook) -> list[dict]:
        """
        Iterate the spine in reading order and attach the TOC entries
        that belong to each spine document
        -- spine doc A has TOC entries I-XVII
        -- spine doc B has TOC entries XVIII-XXXII
        -- etc.
        """
        out = []
        for spine_id, _ in book.spine:
            matches = self.get_entries_by_spine_id(book, spine_id)
            out.append(
                {
                    "spine_id": spine_id,
                    "entries": matches,
                }
            )
        return out

    def get_sections(self, book: EpubBook) -> list[dict]:
        """
        Collects all TOC entry information in spine reading order

        sections[i] = {
            title: <TOC entry title>,
            path: <TOC doc path>,
            fragment: <TOC doc fragment tag>,
            spine_id: <TOC entry spine_id parent>,
            blocks: <entry content blocks (text / images)>
        }
        """
        # -------------------------
        # Get list of { spine_id : <title>, entries: [e1,e2,e3,...] }
        # -- spine_id's mapped to their TOC entries
        # -------------------------
        spine_entries = self.build_spine_entries(book)

        # -------------------------
        # Collect all TOC entries' information
        # -------------------------
        sections: list[dict] = []
        all_images: dict[str, dict] = {}

        for spine_item in spine_entries:
            # -------------------------
            # Get list of TOC entries for spine_id
            # -- entry = {
            #       title: <TOC entry title>,
            #       path: <TOC doc path>,
            #       fragment: <TOC doc fragment tag>
            #    }
            # -------------------------
            entries = spine_item["entries"] or []

            # -------------------------
            # Fallback: No TOC entries but content exists in spine
            # -------------------------
            if not entries:
                fallback = self._default_entry_for_spine_doc(book, spine_item["spine_id"])
                if fallback is None:
                    continue
                entries = [fallback]

            for i, entry in enumerate(entries):
                # -- Get next spine TOC entry (to extract text between current -> next)
                next_entry = entries[i + 1] if i + 1 < len(entries) else None
                # -- Extract text blocks between current -> next TOC entry (or end of doc if no end fragment)
                blocks, images = self.extract_content_blocks(book, entry, next_entry)

                sections.append(
                    {
                        "title": entry["title"],
                        "path": entry["path"],
                        "fragment": entry["fragment"],
                        "spine_id": spine_item["spine_id"],
                        "depth": entry.get("depth", 0),
                        "parent_title": entry.get("parent_title"),
                        "parent_key": entry.get("parent_key"),
                        "blocks": blocks,
                    }
                )
                all_images.update(images)

        return sections, all_images

    def extract_content_blocks(
        self, book: EpubBook, start_entry: dict, end_entry: dict | None
    ) -> tuple[list[dict], dict]:
        """
        entry = {
            "title": str,
            "path": str,
            "fragment": str | None
        }
        """
        doc = self.get_doc_by_path(book, start_entry["path"])
        if doc is None:
            return ([], {})

        # -- Create BeautifulSoup xml parser
        soup = BeautifulSoup(doc.get_body_content(), "lxml")

        start_fragment = start_entry["fragment"]
        end_fragment = end_entry["fragment"] if end_entry else None

        # -------------------------
        # Determine start node
        # -- start_fragment is None: Whole file
        # -- start_fragment != None: Start at start_fragment anchor
        # -------------------------
        if start_fragment is None:
            start = soup.body if soup.body else soup
        else:
            start = soup.find(id=start_fragment)
            if start is None:
                # -- Anchor missing: fallback to whole file
                start = soup.body if soup.body else soup

        # -------------------------
        # Determine end node
        # -- end_fragment is None: Go to end of file
        # -- end_fragment != None: Go to end_fragment anchor
        # -------------------------
        end = soup.find(id=end_fragment) if end_fragment is not None else None

        # -------------------------
        # Include start node itself when anchored to fragment
        # -------------------------
        if start is soup or start is soup.body:
            iterator = start.descendants
        else:
            iterator = itertools.chain([start], start.next_elements)

        blocks: list[dict] = []
        images = {}     # image_key -> {href, media_type, bytes}

        for el in iterator:
            # -------------------------
            # Stop when we reach the end of the fragment
            # -------------------------
            if end is not None and el == end:
                break
            if not isinstance(el, Tag):
                continue

            # -------------------------
            # 1. Images
            # -------------------------
            if el.name == "img":
                src = el.get("src")
                if src:
                    href = resolve_src(doc.get_name(), src)
                    item = self.get_item_by_href(book, href)

                    image_key = href     # use href as key, simplest stable image ID
                    if item is not None and image_key not in images:
                        images[image_key] = {
                            "href": norm_path(item.get_name()),
                            "media_type": getattr(item, "media_type", None),
                            "bytes": item.get_content(),
                        }

                    blocks.append({
                        "type": "image",
                        "image_key": image_key,
                        "src": src,
                        "href": href,
                        "alt": el.get("alt") or None,
                    })
                continue

            # -------------------------
            # 2. Semantic text blocks
            # -------------------------
            if el.name in BLOCK_TAGS:
                # -- Prevent parent/child duplicate blocks
                if self._has_nested_semantic_block(el):
                    continue

                text = el.get_text(" ", strip=True)
                if text:
                    blocks.append({"type": "text", "tag": el.name, "text": text})
                continue

            # -------------------------
            # 3. <div> fallback paragraphs
            # -------------------------
            if is_texty_leaf_div(el):
                blocks.append({"type": "text", "tag": "div", "text": el.get_text(" ", strip=True)})
                continue

        return blocks, images
    
    def extract_epub(self, epub_path: str, out_dir: str):
        """
        Extracts .epub ZIP file to out_dir
        """
        with zipfile.ZipFile(epub_path, "r") as zf:
            zf.extractall(out_dir)

    def _default_entry_for_spine_doc(self, book: EpubBook, spine_id: str) -> dict | None:
        """
        
        """
        id_to_item = self.build_id_to_item(book)
        doc = id_to_item.get(spine_id)
        if doc is None:
            return None
        
        path = norm_path(doc.get_name())

        # -- Fallback title when TOC label is missing
        fallback_title = Path(path).stem.replace("_", " ").replace("-", " ").strip() or path

        return {
            "title": fallback_title,
            "path": path,
            "fragment": None,
            "depth": 0,
            "parent_title": None,
        }
    
    def _has_nested_semantic_block(self, el: Tag) -> bool:
        """
        Determines if an element has a semantic block (e.g., nested p) within it
        """
        for child in el.find_all(BLOCK_TAGS):
            if child is not el:
                return True
        return False

    def _html_to_text(self, html: epub.EpubHtml) -> str:
        """
        Extracts text from HTML document
        """
        soup = BeautifulSoup(html, "xml")
        return soup.get_text()
    
    def _href_to_key(self, href: str) -> str:
        path, sep, fragment = href.partition("#")
        return f"{norm_path(path)}#{fragment if sep else ''}"
