import json, gzip
import sqlite3
from sqlite3 import Cursor
from pathlib import Path
from typing import Iterator, Any
from tqdm import tqdm


def init_db(db_path: Path):
    """
    Initializes SQLite3 database (does not wipe if already exists)
    """
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # -- Initialize table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS dict_entries (
                lang TEXT NOT NULL,
                lemma TEXT NOT NULL,
                pos TEXT NOT NULL,
                ipa TEXT,
                senses_json TEXT NOT NULL,
                raw_json TEXT,
                gloss_lang TEXT,
                PRIMARY KEY (lang, lemma, pos))
    """)

    # -- Create lookup index by (lang, lemma) -> ("fr", "accueil")
    cur.execute(
        "CREATE INDEX IF NOT EXISTS idx_entries_lang_lemma ON dict_entries(lang, lemma)"
    )

    # -- Create table mapping inflected forms to lemmas, e.g., "accueils" -> "accueil"
    cur.execute("""
    CREATE TABLE IF NOT EXISTS dict_forms (
        lang TEXT NOT NULL,
        form TEXT NOT NULL,
        lemma TEXT NOT NULL,
        PRIMARY KEY (lang, form, lemma)
    )            
    """)

    # -- Create lookup index for dict_forms by (lang, form)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_forms_lang_form ON dict_forms(lang, form)")

    # -- Optional: IPA/POS for form pages (surface forms)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS dict_form_entries (
        lang TEXT NOT NULL,
        form TEXT NOT NULL,
        lemma TEXT NOT NULL,
        pos TEXT NOT NULL,
        ipa TEXT,
        PRIMARY KEY (lang, form, lemma, pos)
    )
    """)
    cur.execute(
        "CREATE INDEX IF NOT EXISTS idx_formentries_lang_form ON dict_form_entries(lang, form)"
    )

    conn.commit()
    conn.close()
    print(f"Initialized: {db_path}")


def iter_jsonl_gz(path: Path) -> Iterator[dict[str, Any]]:
    """
    Returns iterator over JSONL gz file
    """
    with gzip.open(path, "rt", encoding="utf-8") as f:
        for line in tqdm(f, desc=path.name):
            line = line.strip()
            if not line:
                continue
            try:
                yield json.loads(line)
            # -- Ignore corrupted lines    
            except json.JSONDecodeError:
                continue


# =========================
# Form Pages
# =========================
def extract_form_lemmas(entry: dict) -> set[str]:
    """
    Gets all lemmas from the form page's senses (e.g., suis -> [être, suivre])
    """
    lemmas = set()

    for sense in (entry.get("senses") or []):
        for form in (sense.get("form_of") or []):
            lemma = form.get("word")
            if lemma:
                lemmas.add(lemma.lower())

    return lemmas


def is_valid_form(entry: dict) -> bool:
    """
    Checks if the entry is only a form-of another word 
    (e.g., a plural or past participle) and contains a lemma
    """
    # -- Verify lang / word exists
    if not entry.get("lang_code") or not entry.get("word"):
        return False

    # -- Check for any existing lemmas
    has_lemma = False

    senses = entry.get("senses") or []
    if not senses:
        return False
    
    for sense in senses:
        tags = sense.get("tags") or []
        if "form-of" not in tags:
            return False
        
        form_of = sense.get("form_of") or []
        # -- Check that a "word" exists in any form_of
        if not any(isinstance(f, dict) and f.get("word") for f in form_of):
            return False
        else:
            has_lemma = True
    
    return has_lemma


def store_form(entry: dict, cur: Cursor):
    """
    Stores form-of entry in dict_forms (e.g., plurals, past participles, etc.)
    """
    # -------------------------
    # Get form-of entry info (already verified to have lang / word / lemma(s))
    # -------------------------
    lang = entry["lang_code"]
    form = entry["word"].lower()
    lemmas = extract_form_lemmas(entry)
    pos = (entry.get("pos") or "").strip()
    ipa = extract_def_ipa(entry)

    for lemma in lemmas:
        cur.execute(
            """
            INSERT OR IGNORE INTO dict_forms (lang, form, lemma)
            VALUES (?, ?, ?)
            """,
            (lang, form, lemma)
        )
        # -- Optional: store surface-form IPA/POS if available
        cur.execute(
            """
            INSERT OR REPLACE INTO dict_form_entries (lang, form, lemma, pos, ipa)
            VALUES (?, ?, ?, ?, ?)
            """,
            (lang, form, lemma, pos, ipa)
        )


# =========================
# Definitions
# =========================
def has_glosses(entry: dict) -> bool:
    """
    Checks if the dictionary entry has at least one definition in senses
    """
    senses = entry.get("senses") or []

    for sense in senses:
        if sense.get("glosses"):
            return True
    return False


def _ipa_score(raw_ipa: str) -> tuple[int, int, int]:
    """
    Lower is better.
    Returns (wrapper_penalty, heavy_penalty, length_penalty).
    """
    _PHONETIC_HEAVY = set([
        "̞", "̝", "̪", "̩", "̯", "̃", "ː", "ˑ", "̥", "̬",
        "β", "ð", "ɣ", "ʝ", "ɾ", "ɱ", "ŋ", "ɲ", "ʎ",
        "ʃ", "ʒ"
    ])

    s = raw_ipa.strip()

    # Prefer phonemic slashes if present
    if s.startswith("/") and s.endswith("/"):
        wrapper_penalty = 0
    elif s.startswith("[") and s.endswith("]"):
        wrapper_penalty = 2
    else:
        wrapper_penalty = 1

    # Penalize "phonetic-heavy" symbols/diacritics
    heavy_penalty = sum(1 for ch in s if ch in _PHONETIC_HEAVY)

    # Slight preference for shorter strings
    length_penalty = len(s)

    return (wrapper_penalty, heavy_penalty, length_penalty)


def extract_def_ipa(entry: dict) -> str | None:
    """
    Pick the simplest IPA variant available (prefer phonemic).
    """
    sounds = entry.get("sounds") or []

    candidates: list[str] = []
    for sound in sounds:
        ipa = sound.get("ipa")
        if not ipa:
            continue

        # Skip phrase / liaison pronunciations
        if " " in ipa or "‿" in ipa:
            continue

        ipa = ipa.strip()
        if ipa:
            candidates.append(ipa)

    if not candidates:
        return None

    # Choose best candidate by score
    best = min(candidates, key=_ipa_score)

    # Normalize: strip wrappers; UI will add /.../
    return best.strip("[]/\\")


def extract_def_senses(entry: dict) -> list[dict]:
    """
    Returns list of definition senses (definitions/examples)
    """
    senses = []

    for sense in (entry.get("senses") or []):
        glosses = sense.get("glosses")
        if not glosses:
            continue

        gloss = glosses[0]
        tags = sense.get("tags") or []
        examples = [ex["text"] for ex in (sense.get("examples") or [])
                    if "text" in ex]
        
        senses.append({
            "gloss": gloss,
            "tags": tags,
            "examples": examples
        })

    return senses


def extract_def_forms(entry: dict) -> set[str]:
    """
    Returns set of forms of the definition lemma (e.g., accueils for accueil)
    """
    forms = set()

    for f in entry.get("forms", []):
        form: str = f.get("form")
        if form:
            forms.add(form.lower())

    return forms
    

def is_valid_def(entry: dict) -> bool:
    """
    Checks that the entry has a lang, lemma, pos, and definition in senses
    """
    return bool(
        entry.get("lang_code") and
        entry.get("word") and
        entry.get("pos") and
        has_glosses(entry)
    )


def store_def(entry: dict, cur: Cursor, gloss_lang: str, store_raw: bool=False):
    """
    Stores definition entry info (lemma and supporting info) / raw entry in dict_entries
    and stores lemma's forms in dict_forms
    """
    # -------------------------
    # Store definition
    # -------------------------
    lang = entry["lang_code"]
    lemma = entry["word"].lower()
    pos = entry["pos"]
    ipa = extract_def_ipa(entry)
    senses_json = json.dumps(extract_def_senses(entry), ensure_ascii=False)
    raw_json = json.dumps(entry, ensure_ascii=False) if store_raw else None

    cur.execute(
        """
        INSERT OR REPLACE INTO dict_entries
        (lang, lemma, pos, ipa, senses_json, raw_json, gloss_lang)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (lang, lemma, pos, ipa, senses_json, raw_json, gloss_lang)
    )

    # -------------------------
    # Store lemma's forms
    # -------------------------
    forms = extract_def_forms(entry)

    for form in forms:
        cur.execute(
            "INSERT OR IGNORE INTO dict_forms (lang, form, lemma) VALUES (?, ?, ?)",
            (lang, form, lemma)
        )


def parse_wiktionary(json_path: Path, db_path: Path, source_lang: str, batch_size: int=50_000):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # -- Enable faster pragmas for speedup
    cur.execute("PRAGMA journal_mode=WAL;")
    cur.execute("PRAGMA synchronous=NORMAL;")
    cur.execute("PRAGMA temp_store=MEMORY;")

    dict_entries = iter_jsonl_gz(json_path)

    n = 0
    for entry in dict_entries:
        # -------------------------
        # Store form-of pages in dict_forms
        # -------------------------
        if is_valid_form(entry):
            store_form(entry, cur)
        # -------------------------
        # Store valid definitions in dict_entries
        # -------------------------
        elif is_valid_def(entry):
            store_def(entry, cur, source_lang)

        n += 1
        if n % batch_size == 0:
            conn.commit()
            print(f"Committed {n:,} entries...")

    conn.commit()
    conn.close()
    print(f"Done. Total processed: {n:,}")


def main():
    db_path = Path.home() / "data" / "babeling" / "definitions_with_forms.sqlite"

    init_db(db_path)

    source_langs = ["en", "fr", "es", "it", "de"]
    for source_lang in source_langs:
        json_path = Path.home() / "data" / "babeling" / f"{source_lang}-extract.jsonl.gz"

        parse_wiktionary(json_path, db_path, source_lang)
    

if __name__ == "__main__":
    main()
