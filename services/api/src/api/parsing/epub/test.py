import os
from pathlib import Path

from .document import EpubDocument
from .parser import EpubParser


def main():
    epub_path = Path.home() / "projects/babeling/testing/epub/the-little-prince.epub"
    
    parser = EpubParser()

    epub_doc = parser.build_document(epub_path=epub_path)


if __name__ == "__main__":
    main()