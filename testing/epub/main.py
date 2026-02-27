# main.py
#
# Simple test harness for your EpubParser + EpubDocument that:
# - Builds the document
# - Prints metadata + cover info
# - Prints section/block previews showing where images appear in order
# - Verifies that image blocks reference entries in doc.images
# - Optionally writes a few images to disk so you can visually confirm placement
#
# Run (from the package root that contains this folder):
#   python -m testing.main
#
# Or if this file sits alongside parser.py/document.py in a package:
#   python -m <your_package>.main

from __future__ import annotations

from pathlib import Path
import re

from .parser import EpubParser
from .document import EpubDocument


def main():
    epub_name = "the-brothers-karamazov"
    epub_path = Path(f"testing/epub/{epub_name}.epub")  # change as needed

    parser = EpubParser()
    doc = parser.build_document(epub_path=epub_path)

    out_path = f"testing/epub/{epub_name}/pages.txt"

    doc.save_pages(out_path)


if __name__ == "__main__":
    main()