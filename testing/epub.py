import io
from ebooklib import epub, ITEM_COVER, ITEM_IMAGE, ITEM_DOCUMENT
from ebooklib.epub import EpubBook
from pathlib import Path, PurePosixPath
from PIL import Image
from bs4 import BeautifulSoup, Tag
import zipfile


def extract_epub(epub_path: str, out_dir: str):
    with zipfile.ZipFile(epub_path, "r") as zf:
        zf.extractall(out_dir)


def normalize_path(p: str) -> str:
    return str(PurePosixPath(p))


class EpubParser:
    """
    TOC:
    - Each TOC link has: filename.xtml#anchor

    Spine:
    - Used to determine reading order

    Chapters:
    - Chapters are determined from TOC entries
    """
    def __init__(self):
        pass

    def build_id_to_item(self, book: EpubBook):
        """
        
        """
        id_to_item = {
            item.get_id(): item
            for item in book.get_items_of_type(ITEM_DOCUMENT)
        }
        return id_to_item
    
    def get_doc_by_path(self, book: EpubBook, path: str):
        """
        
        """
        for item in book.get_items_of_type(ITEM_DOCUMENT):
            if normalize_path(item.get_name()).endswith(normalize_path(path)):
                return item
        return None

    def get_metadata(self, book: EpubBook, label: str) -> str | None:
        """
        
        """
        try:
            meta = book.get_metadata("DC", label)[0][0]
        except:
            meta = None
        return meta
    
    def flatten_toc(self, toc):
        """
        
        """
        out = []
        for item in toc:
            if isinstance(item, tuple):
                section, children = item
                out.extend(self.flatten_toc(children))
            else:
                out.append(item)
        return out
    
    def get_cover_image(self, book: EpubBook) -> Image.Image | None:
        """
        
        """
        image_bytes = None

        for item in book.get_items():
            if item.get_type() == ITEM_COVER:
                image_bytes = item.get_content()
            elif item.get_type() == ITEM_IMAGE:
                if "cover" in item.get_name().lower():
                    image_bytes = item.get_content()
        
        if image_bytes:
            image = Image.open(io.BytesIO(image_bytes))
            return image
        else:
            return None
        
    def get_entries_by_spine_id(self, book: EpubBook, spine_id: str) -> list[dict]:
        """
        
        """
        id_to_item = self.build_id_to_item(book)
        if spine_id not in id_to_item:
            return []
        
        doc = id_to_item[spine_id]
        filename = doc.get_name()

        toc_links = self.flatten_toc(book.toc)

        matches = []
        for link in toc_links:
            href = link.href
            link_filename, sep, fragment = href.partition("#")

            if link_filename == filename:
                matches.append({
                    "title": link.title,
                    "path": link_filename,
                    "fragment": fragment if sep else None,
                })
        return matches
    
    def build_spine_entries(self, book: EpubBook) -> list[dict]:
        """
        
        """
        out = []
        for spine_id, _ in book.spine:
            matches = self.get_entries_by_spine_id(book, spine_id)
            out.append({
                "spine_id": spine_id,
                "entries": matches,
            })
        return out
    
    def get_chapters(self, book: EpubBook):
        """
        
        """
        id_to_item = self.build_id_to_item(book)

        chapters = []
        for id, _ in book.spine:
            if id in id_to_item:
                chapters.append(id_to_item[id])

        return chapters
    
    def _html_to_text(self, html: epub.EpubHtml) -> str:
        """
        
        """
        soup = BeautifulSoup(html, "xml")
        return soup.get_text()
    
    def get_chapter_texts(self, book: EpubBook) -> list[str]:
        """
        
        """
        # -------------------------
        # Get all ITEM_DOCUMENTs that are in the spine
        # -------------------------
        chapters = self.get_chapters(book)

        # -------------------------
        # Convert chapter body HTML to text
        # -------------------------
        chapter_texts = []
        for chapter in chapters:
            html = chapter.get_body_content()
            text = self.html_to_text(html)
            chapter_texts.append(text)

        return chapter_texts
    
    def get_fragment_text(self, book: EpubBook, start_entry: dict, end_entry: dict | None) -> str:
        """
        entry = {
            "title": str,
            "path": str,
            "fragement": str | None
        }
        """
        doc = self.get_doc_by_path(book, start_entry["path"])
        if doc is None:
            return ""
        
        # -- Create BeautifulSoup xml parser
        soup = BeautifulSoup(doc.get_body_content(), "xml")

        start_fragment = start_entry["fragment"]
        end_fragment = end_entry["fragment"] if end_entry else None

        # -------------------------
        # fragment == None: Get whole file
        # -------------------------
        if not start_fragment:
            return soup.get_text("\n").strip()  # separate children by newline

        # -------------------------
        # fragment != None: Get between start / end
        # -------------------------
        start = soup.find(id=start_fragment)
        # -- If fragment not found or no end fragment, return full text
        if start is None or end_fragment is None:
            return soup.get_text("\n").strip()
        
        # -- Collect everything between start / end
        end = soup.find(id=end_fragment)

        text_chunks = []
        for el in start.next_elements:
            # -- Stop when we reach the end fragment
            if end and el == end:
                break
            # -- Only collect block-level tags
            if isinstance(el, Tag) and el.name in {
                "p", "h1", "h2", "h3", "h4", "h5", "h6",
                "li", "blockquote", "div", "pre"
            }:
                text = el.get_text(" ", strip=True)
                if text:
                    text_chunks.append(text)

        return "\n\n".join(text_chunks)
    
    def walk_toc(self, toc, depth=0):
        for item in toc:
            if isinstance(item, tuple):
                section, children = item
                print("  " * depth + f"[SECTION] {section.title}")
                self.walk_toc(children, depth + 1)
            else:
                print("  " * depth + f"[LINK] {item.title} -> {item.href}")


def main():
    # epub_path = Path("./beowulf.epub")
    # epub_path = Path("./frankenstein.epub")
    # epub_path = Path("./the-brothers-karamazov.epub")
    epub_path = Path("./the-little-prince.epub")

    parser = EpubParser()

    book = epub.read_epub(epub_path)

    spine_entries = parser.build_spine_entries(book)

    for item in spine_entries:
        entries = item["entries"]
        for i, entry in enumerate(entries):
            # -- Last entry has no end fragment
            if i == len(entries) - 1:
                text = parser.get_fragment_text(book, entry, None)
            else:
                text = parser.get_fragment_text(book, entry, entries[i + 1])
            print(text)



if __name__ == "__main__":
    main()
