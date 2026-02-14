from binaryalign.tokenization import Segmenter


_segmenters: dict[tuple[str, str], Segmenter] = {}

def get_segmenter(src_lang: str, tgt_lang: str) -> Segmenter:
    key = (src_lang, tgt_lang)
    if key not in _segmenters:
        _segmenters[key] = Segmenter(src_lang, tgt_lang)
    return _segmenters[key]