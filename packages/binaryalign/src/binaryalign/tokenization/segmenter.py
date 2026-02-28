import re
import spacy


NLP_LANGS = {
    "en": "en_core_web_sm",
    "fr": "fr_core_news_sm",
    "it": "it_core_news_sm",
    "es": "es_core_news_sm",
    "de": "de_core_news_sm"
}


class Segmenter:
    def __init__(self, lang: str):
        # -------------------------
        # Load spaCy NLP model
        # -------------------------
        self.nlp = spacy.load(NLP_LANGS[lang], exclude=["parser"])
        self.nlp.enable_pipe("senter")

    def split_words(self, text: str) -> list[str]:
        """ """
        # -- Reuse the same one-pass tokenizer that also produces spaces, so
        #    the render token stream always comes from one canonical source.
        words, _ = self.tokenize_with_spaces(text)
        return words
    
    def tokenize_with_spaces(self, text: str) -> tuple[list[str], list[str]]:
        """
        Tokenizes `text` once with spaCy and returns:
        1) the renderable tokens (excluding pure whitespace tokens)
        2) the exact trailing whitespace for each token

        This is the canonical render tokenization path. The key idea is that
        the words and spaces come from the same spaCy document pass, which
        avoids later attempts to "re-find" tokens inside the raw text.
        """
        # -------------------------
        # Tokenize text once
        # -------------------------
        doc = self.nlp(text)

        words: list[str] = []
        spaces: list[str] = []

        for token in doc:
            # -- Skip pure whitespace tokens
            if token.is_space:
                continue

            words.append(token.text)
            spaces.append(token.whitespace_)

        return words, spaces

    def find_token_span(
        self,
        full_tokens: list[str],
        sentence_tokens: list[str],
        start_idx: int = 0,
    ) -> tuple[int, int]:
        """
        Finds `sentence_tokens` as one contiguous slice inside `full_tokens`,
        searching from `start_idx` forward.

        This is used to map sentence-level tokenization back onto the single
        full-text token stream so global token indices stay aligned with the
        exact words/spaces that the UI renders.

        Returns:
            (start, end): slice bounds such that:
                full_tokens[start:end] == sentence_tokens
        """
        # -- Empty sentence maps to an empty slice at the current cursor
        if not sentence_tokens:
            return start_idx, start_idx

        # -------------------------
        # Search for exact contiguous match
        # -------------------------
        max_start = len(full_tokens) - len(sentence_tokens)
        for i in range(start_idx, max_start + 1):
            if full_tokens[i:i + len(sentence_tokens)] == sentence_tokens:
                return i, i + len(sentence_tokens)

        raise ValueError(
            f"Could not map sentence tokens back to full token stream from index {start_idx}"
        )

    def split_sents(self, text: str) -> list[str]:
        """ """
        doc = self.nlp(text)
        sents = [s.text.strip() for s in doc.sents if s.text.strip()]
        return sents
    
    def split_sents_punct(self, text: str) -> list[str]:
        """
        Sentence splitter based on terminal punctuation, with guardrails for:
        - NBSP / weird whitespace normalization (for splitting only)
        - spaced ellipses ". . ." and double dots ".."
        - decimal/version dots between digits (3.14, 1.0.2)
        - common abbreviations / initials that end in '.' (Dr., U.S., e.g.)
        - post-pass merge for lonely quote/paren closers/openers (», «, ", ', ), ])
        """
        if not text:
            return []

        # -------------------------
        # Normalize (splitting only)
        # -------------------------
        t = (
            text.replace("\r\n", "\n")
            .replace("\r", "\n")
            .replace("\u00A0", " ")  # NBSP
            .strip()
        )

        # Normalize spaced ellipsis: ". . ." -> "..."
        t = re.sub(r"\.\s*\.\s*\.", "...", t)
        # Normalize double dot -> ellipsis (common OCR-ish artifact)
        t = re.sub(r"(?<!\.)\.\.(?!\.)", "...", t)

        # -------------------------
        # Protect things that look like "a period but not a sentence end"
        # -------------------------
        DOT = "\uE000"  # private-use char unlikely to appear in text

        # Protect decimals / version-like dots between digits: 3.14, 1.0.2
        t = re.sub(r"(?<=\d)\.(?=\d)", DOT, t)

        # Protect common abbreviations (both EN/FR-ish); keep this list small+high precision
        # NOTE: This is intentionally conservative; you can expand as needed.
        abbr = [
            r"(?<!\w)Mr\.(?!\w)", r"(?<!\w)Mrs\.(?!\w)", r"(?<!\w)Ms\.(?!\w)",
            r"(?<!\w)Dr\.(?!\w)", r"(?<!\w)Prof\.(?!\w)", r"(?<!\w)Sr\.(?!\w)",
            r"(?<!\w)Jr\.(?!\w)", r"(?<!\w)St\.(?!\w)", r"(?<!\w)No\.(?!\w)",
            r"(?<!\w)Inc\.(?!\w)", r"(?<!\w)Ltd\.(?!\w)", r"(?<!\w)Co\.(?!\w)",
            r"(?<!\w)vs\.(?!\w)", r"(?<!\w)etc\.(?!\w)", r"(?<!\w)e\.g\.(?!\w)",
            r"(?<!\w)i\.e\.(?!\w)", r"(?<!\w)U\.S\.(?!\w)", r"(?<!\w)U\.K\.(?!\w)",
            r"(?<!\w)E\.U\.(?!\w)", r"(?<!\w)M\.(?!\w)", r"(?<!\w)Mme\.(?!\w)",
            r"(?<!\w)Mlle\.(?!\w)", r"(?<!\w)p\.\s*ex\.(?!\w)",
            r"(?<!\w)c\.-à-d\.(?!\w)", r"(?<!\w)n°\.(?!\w)"
        ]
        # Replace the final dot in each abbreviation with DOT
        for a in abbr:
            t = re.sub(a, lambda m: m.group(0)[:-1] + DOT, t)

        # Protect initials like "J. R. R. Tolkien" (replace dots after single letters)
        # (This is a heuristic; still conservative.)
        t = re.sub(r"\b([A-Za-zÀ-ÖØ-öø-ÿ])\.(?=\s*[A-Za-zÀ-ÖØ-öø-ÿ]\.)", r"\1" + DOT, t)

        # -------------------------
        # Regex split by terminal punctuation, allowing closers after it
        # -------------------------
        TERMINAL = r"(?:\.\.\.|…|[.!?])"
        CLOSERS = r"""["'”»)\]\}]+"""  # things that can trail a sentence

        sent_re = re.compile(
            rf".*?{TERMINAL}(?:\s*{CLOSERS})?(?=\s+|$)",
            re.DOTALL
        )

        parts: list[str] = []
        last_end = 0
        for m in sent_re.finditer(t):
            parts.append(m.group(0).strip())
            last_end = m.end()

        tail = t[last_end:].strip()
        if tail:
            parts.append(tail)

        # Restore protected dots
        parts = [p.replace(DOT, ".") for p in parts]
        parts = [p for p in parts if p]

        # -------------------------
        # Post-pass merge: lonely openers/closers
        # -------------------------
        # If the model puts « or » (or similar) alone, merge into neighbor.
        OPENERS_ONLY = re.compile(r'^[\s"\'“«(\[\{—–-]+$')
        CLOSERS_ONLY = re.compile(r'^[\s"\'”»)\]\}]+$')

        merged: list[str] = []
        i = 0
        while i < len(parts):
            s = parts[i].strip()

            # If this chunk is only closers, attach to previous if possible
            if CLOSERS_ONLY.match(s):
                if merged:
                    merged[-1] = (merged[-1].rstrip() + " " + s).strip()
                else:
                    merged.append(s)
                i += 1
                continue

            # If this chunk is only openers, attach to next if possible
            if OPENERS_ONLY.match(s):
                if i + 1 < len(parts):
                    parts[i + 1] = (s + " " + parts[i + 1].lstrip()).strip()
                else:
                    merged.append(s)
                i += 1
                continue

            merged.append(s)
            i += 1

        return merged

    def split_pars(self, text: str) -> list[str]:
        """ """
        # -- Normalize windows newlines
        text = text.replace("\r\n", "\n").replace("\r", "\n")
        # -- Split on blank lines (one or more)
        pars = re.split(r"\n\s*\n+", text)

        return [p.strip() for p in pars if p.strip()]

    def split_par_sents(self, text: str) -> list[list[str]]:
        """ """
        pars = self.split_pars(text)

        par_sents = []

        for par in pars:
            sents = self.split_sents_punct(par)
            par_sents.append(sents)

        return par_sents
    
    def split_par_sent_words(self, text: str) -> list[list[list[str]]]:
        """ """
        par_sents = self.split_par_sents(text)

        par_sent_words = []

        for par in par_sents:
            # -- Split each sentence into words
            sent_words = []
            for sent in par:
                words = self.split_words(sent)
                sent_words.append(words)
            # -- Store all split sentences in paragraph
            par_sent_words.append(sent_words)

        return par_sent_words

    def split_pages(self, text: str, max_chars: int=2500) -> list[str]:
        """ """
        # -------------------------
        # Normalize whitespace / split into pars[sents]
        # -------------------------
        text = self.normalize_text(text)
        par_sents = self.split_par_sents(text)

        # -------------------------
        # Build each page until max_chars
        # -------------------------
        pages: list[str] = []
        cur_sents: list[str] = []
        cur_len = 0

        for par in par_sents:
            # -- Keep paragraphs on the same page
            page_break = False

            for sent in par:
                sent_len = len(sent) + 1    # space/newline

                # -- At > max_chars, build page and append
                if cur_len + sent_len > max_chars:
                    page_break = True
                
                # -- Add sentence to page
                cur_sents.append(sent)
                cur_len += sent_len

            # -- Create page and move to next one
            if page_break:
                pages.append(" ".join(cur_sents).strip())
                cur_sents = []
                cur_len = 0
            # -- Preserve paragraph break inside page
            else:
                cur_sents.append("\n\n")
                cur_len += 2

        last_page = " ".join(cur_sents).strip()
        if last_page:
            pages.append(last_page)

        return pages

    def normalize_text(self, text: str):
        text = text.replace("\r\n", "\n").replace("\r", "\n")

        # Split into paragraphs on blank lines
        paras = re.split(r"\n\s*\n+", text.strip())

        # De-wrap each paragraph: replace remaining newlines with spaces
        paras = [re.sub(r"\s*\n\s*", " ", p).strip() for p in paras if p.strip()]

        # Re-join paragraphs with a single newline (already spaced by ParagraphGrid)
        return "\n\n".join(paras)
    
    def get_token_spaces(self, text: str, tokens: list[str]) -> list[str]:
        """ 
        Returns trailing whitespace for each token.

        Primary strategy:
            tokenize `text` once with spaCy and read `token.whitespace_`.

        Fallback strategy:
            if `tokens` is a filtered/reordered subset, align as an ordered
            subsequence against spaCy token stream to avoid `str.find` drift.

        Returns:
            spaces (list[str]): List of trailing whitespaces (or "") for each token in text
        """
        # -- Tokenize once to get the canonical token/space stream
        doc_tokens, doc_spaces = self.tokenize_with_spaces(text)

        # -- Fast path: tokenization matches exactly.
        if tokens == doc_tokens:
            return doc_spaces

        # -- Robust path: align requested tokens against spaCy token stream
        # in order. This prevents catastrophic drift when one token mismatches.
        spaces: list[str] = []
        j = 0

        for token in tokens:
            while j < len(doc_tokens) and doc_tokens[j] != token:
                j += 1

            if j >= len(doc_tokens):
                spaces.append("")
                continue

            spaces.append(doc_spaces[j])
            j += 1

        return spaces
