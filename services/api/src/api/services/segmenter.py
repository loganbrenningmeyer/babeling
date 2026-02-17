from binaryalign.tokenization import Segmenter


_segmenters: dict[str, Segmenter] = {}

def get_segmenter(lang: str) -> Segmenter:
    if lang not in _segmenters:
        _segmenters[lang] = Segmenter(lang)
    return _segmenters[lang]