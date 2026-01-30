import os
import json
import sqlite3
from sqlite3 import Cursor
from pathlib import Path
from typing import Any

"""
[Database Format]

[Forms]
dict_forms(
  lang   TEXT,
  form   TEXT,   -- surface form: "accueils", "suis", "reading"
  lemma  TEXT    -- base form: "accueil", "être", "read"
)

('fr', 'accueils', 'accueil')
('fr', 'suis', 'être')
('fr', 'suis', 'suivre')
('en', 'reading', 'read')

[Entries]
dict_entries(
  lang        TEXT,
  lemma       TEXT,
  pos         TEXT,   -- "noun", "verb", etc.
  ipa         TEXT,   -- one canonical IPA
  senses_json TEXT,   -- JSON list of senses
  raw_json    TEXT    -- optional, for debugging
)

PRIMARY KEY (lang, lemma, pos)

senses = [
  {
    "gloss": "Cérémonie ou prestation réservée à un nouvel arrivant...",
    "tags": [],
    "examples": []
  },
  {
    "gloss": "Lieu où sont accueillies les personnes.",
    "tags": []
  }
]
"""

DB_PATH = Path(os.environ.get("BABELING_ROOT")) / "data" / "definitions.sqlite"


def get_lemmas(word: str, lang: str, cur: Cursor) -> list[str]:
    """
    Given a word / lang, checks if it is a form of any lemmas in
    dict_forms, otherwise returns the original word
    """
    cur.execute(
        "SELECT lemma FROM dict_forms WHERE lang=? AND form=?",
        (lang, word)
    )
    lemmas = [row[0] for row in cur.fetchall()]

    out = []
    for x in [word, *lemmas]:
        if x not in out:
            out.append(x)

    return out


def get_lemma_entries(lemmas: list[str], lang: str, cur: Cursor, max_senses: int=10) -> list[dict]:
    """
    Returns definition info for the possible lemmas / lang for use
    in determining the proper lemma / POS in the context of the text
    """
    cur.execute(
        f"""
        SELECT lemma, pos, senses_json, gloss_lang
        FROM dict_entries
        WHERE lang=? AND lemma IN ({','.join('?' for _ in lemmas)})
        """,
        [lang, *lemmas]
    )
    rows = cur.fetchall()

    entries = []
    for lemma, pos, senses_json, gloss_lang in rows:
        # -------------------------
        # Limit entry glosses to max_senses
        # -------------------------
        senses = json.loads(senses_json)
        glosses = [s["gloss"] for s in senses[:max_senses]]

        entries.append({
            "lemma": lemma,
            "pos": pos,
            "glosses": glosses,
            "gloss_lang": gloss_lang
        })
    
    return entries


def get_definition_candidates(word: str, lang: str) -> list[dict]:
    """
    Given a word / lang, gets definition info for all candidate lemmas 
    that map to the word

    Returns:
        candidates (list[dict]): List of definition info for each candidate lemma
            - {"lemma": str, "pos": str, "glosses": list[str], "gloss_lang": str}
    """
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    word = word.lower()

    # -------------------------
    # Determine lemma(s)
    # -------------------------
    lemmas = get_lemmas(word, lang, cur)

    # -------------------------
    # Get candidate definition info
    # -------------------------
    candidates = get_lemma_entries(lemmas, lang, cur)

    return candidates


def get_ipa(lemma: str, pos: str, lang: str) -> str:
    """
    
    """
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute(
        """
        SELECT ipa
        FROM dict_entries
        WHERE lang=? AND lemma=? AND pos=?
        """,
        (lang, lemma, pos)
    )
    row = cur.fetchone()
    return row[0] if row and row[0] else None    