// -------------------------
// Base Messages Schema
// -- Fields must be shared by all languages
// -------------------------
export type highlightHeader = {
  prefix: string;
  highlight: string;
  suffix: string;
}

type MessagesSchema = {
  // -------------------------
  // Languages
  // -------------------------
  langs: {
    en: string;
    es: string;
    fr: string;
    de: string;
    it: string;
  },

  // -------------------------
  // Navigation Bar
  // -------------------------
  nav: {
    translate: string;
    library: string;
    preferences: string;
    signIn: string;
  },

  // -------------------------
  // Upload Page
  // -------------------------
  upload: {
    original: string;
    translation: string;
    sampleText: string;
    selectSample: string;
    title: string;
    untitledDocument: string;
    typeText: string;
    dragDrop: string;
    translate: string;
    uploadHint: string;
  },

  // -------------------------
  // Reader Page
  // -------------------------
  reader: {
    // ---- ( Blur-mode Toggle )
    blurModeToggle: {
      header: highlightHeader;
      word: string;
      sentence: string;
      paragraph: string;
    },
    
    // ---- ( Help Popover )
    helpPopover: {
      header: string;
      // -- Page navigation
      pageNav: {
        header: string;
        prevPage: string;
        nextPage: string;
      },
      // -- Reveal / hide original text
      sourceNav: {
        header: highlightHeader;
        revealSent: string;
        hideSent: string;
        revealPar: string;
        hidePar: string;
      },
      // -- Click original words to toggle visibility
      sourceClick: {
        header: highlightHeader;
        toggleVis: string;
      },
      // -- Click translated words for info
      targetClick: {
        header: highlightHeader;
        defineAndExplain: string;
        close: string;
      },
      // -- Click IPA to hear pronunciation
      ipaClick: {
        header: highlightHeader;
        playPronunciation: string;
      },
    },

    // ---- ( Annotation Card )
    annotationCard: {
      baseForm: string;
      sentence: string;
      paragraph: string;
      saveDefinition: string;
      defUnavailable: string;
    },

    // ---- ( General UI )
    general: {
      showOriginal: string;
      hideOriginal: string;
      page: string;
    },
  },

  // -------------------------
  // Library Page
  // -------------------------
  library: {
    // ---- ( General UI )
    all: string;
    texts: string;
    translations: string;
    glossary: string;
  }
}

// =========================
// ( English )
// =========================
export const en = {
  // -------------------------
  // Languages
  // -------------------------
  langs: {
    en: "English",
    es: "Spanish",
    fr: "French",
    de: "German",
    it: "Italian",
  },

  // -------------------------
  // Navigation Bar
  // -------------------------
  nav: {
    translate: "Translate",
    library: "Library",
    preferences: "Preferences",
    signIn: "Sign In",
  },

  // -------------------------
  // Upload Page
  // -------------------------
  upload: {
    original: "Original",
    translation: "Translation",
    sampleText: "Sample Text",
    selectSample: "Select a sample",
    title: "Title",
    untitledDocument: "Untitled Document",
    typeText: "Type some {lang} text...",
    dragDrop: "Drag & drop files here, or click to browse",
    translate: "Translate",
    uploadHint: "Paste text or upload a file to translate",
  },

  // -------------------------
  // Reader Page
  // -------------------------
  reader: {
    // ---- ( Blur-mode Toggle )
    blurModeToggle: {
      header: {
        prefix: "Toggle",
        highlight: "original",
        suffix: "text visibility by",
      },
      word: "Word",
      sentence: "Sentence",
      paragraph: "Paragraph",
    },
    
    // ---- ( Help Popover )
    helpPopover: {
      header: "Navigation and Interactions",
      // -- Page navigation
      pageNav: {
        header: "Page navigation",
        prevPage: "Previous page",
        nextPage: "Next page",
      },
      // -- Reveal / hide original text
      sourceNav: {
        header: {
          prefix: "Reveal / hide",
          highlight: "original",
          suffix: "text",
        },
        revealSent: "Reveal sentence",
        hideSent: "Hide sentence",
        revealPar: "Reveal paragraph",
        hidePar: "Hide paragraph",
      },
      // -- Click original words to toggle visibility
      sourceClick: {
        header: {
          prefix: "Click",
          highlight: "original",
          suffix: "words to toggle visibility"
        },
        toggleVis: "Toggle visibility",
      },
      // -- Click translated words for info
      targetClick: {
        header: {
          prefix: "Click",
          highlight: "translated",
          suffix: "words for info",
        },
        defineAndExplain: "Definition and explanation",
        close: "Close",
      },
      // -- Click IPA to hear pronunciation
      ipaClick: {
        header: {
          prefix: "Click",
          highlight: "IPA",
          suffix: "to hear pronunciation",
        },
        playPronunciation: "Play pronunciation",
      },
    },

    // ---- ( Annotation Card )
    annotationCard: {
      baseForm: "Base form",
      sentence: "Sentence",
      paragraph: "Paragraph",
      saveDefinition: "Save definition",
      defUnavailable: "Definition unavailable",
    },

    // ---- ( General UI )
    general: {
      showOriginal: "Show original",
      hideOriginal: "Hide original",
      page: "Page",
    },
  },

  // -------------------------
  // Library Page
  // -------------------------
  library: {
    // ---- ( General UI )
    all: "All",
    texts: "Texts",
    translations: "Translations",
    glossary: "Glossary",
  }
} satisfies MessagesSchema;

// =========================
// ( Spanish )
// =========================
export const es = {
  // -------------------------
  // Languages
  // -------------------------
  langs: {
    en: "Inglés",
    es: "Español",
    fr: "Francés",
    de: "Alemán",
    it: "Italiano",
  },

  // -------------------------
  // Navigation Bar
  // -------------------------
  nav: {
    translate: "Traducir",
    library: "Biblioteca",
    preferences: "Preferencias",
    signIn: "Iniciar sesión",
  },

  // -------------------------
  // Upload Page
  // -------------------------
  upload: {
    original: "Original",
    translation: "Traducción",
    sampleText: "Texto de muestra",
    selectSample: "Selecciona una muestra",
    title: "Título",
    untitledDocument: "Documento sin título",
    typeText: "Escribe un texto en {lang}...",
    dragDrop: "Arrastra y suelta archivos aquí, o haz clic para explorar",
    translate: "Traducir",
    uploadHint: "Pega texto o sube un archivo para traducir",
  },

  // -------------------------
  // Reader Page
  // -------------------------
  reader: {
    // ---- ( Blur-mode Toggle )
    blurModeToggle: {
      header: {
        prefix: "Alternar la visibilidad del texto",
        highlight: "original",
        suffix: "por",
      },
      word: "Palabra",
      sentence: "Oración",
      paragraph: "Párrafo",
    },
    
    // ---- ( Help Popover )
    helpPopover: {
      header: "Navegación e Interacciones",
      // -- Page navigation
      pageNav: {
        header: "Navegación de páginas",
        prevPage: "Página anterior",
        nextPage: "Página siguiente",
      },
      // -- Reveal / hide original text
      sourceNav: {
        header: {
          prefix: "Mostrar / ocultar texto",
          highlight: "original",
          suffix: "",
        },
        revealSent: "Mostrar oración",
        hideSent: "Ocultar oración",
        revealPar: "Mostrar párrafo",
        hidePar: "Ocultar párrafo",
      },
      // -- Click original words to toggle visibility
      sourceClick: {
        header: {
          prefix: "Haz clic en palabras del",
          highlight: "original",
          suffix: "para alternar la visibilidad",
        },
        toggleVis: "Alternar visibilidad",
      },
      // -- Click translated words for info
      targetClick: {
        header: {
          prefix: "Haz clic en palabras",
          highlight: "traducidas",
          suffix: "para ver información",
        },
        defineAndExplain: "Definición y explicación",
        close: "Cerrar",
      },
      // -- Click IPA to hear pronunciation
      ipaClick: {
        header: {
          prefix: "Haz clic en",
          highlight: "IPA",
          suffix: "para escuchar la pronunciación",
        },
        playPronunciation: "Reproducir pronunciación",
      },
    },

    // ---- ( Annotation Card )
    annotationCard: {
      baseForm: "Forma base",
      sentence: "Oración",
      paragraph: "Párrafo",
      saveDefinition: "Guardar definición",
      defUnavailable: "Definición no disponible",
    },

    // ---- ( General UI )
    general: {
      showOriginal: "Mostrar original",
      hideOriginal: "Ocultar original",
      page: "Página",
    },
  },

  // -------------------------
  // Library Page
  // -------------------------
  library: {
    // ---- ( General UI )
    all: "Todo",
    texts: "Textos",
    translations: "Traducciones",
    glossary: "Glosario",
  }
} satisfies MessagesSchema;

// =========================
// ( French )
// =========================
export const fr = {
  // -------------------------
  // Languages
  // -------------------------
  langs: {
    en: "Anglais",
    es: "Espagnol",
    fr: "Français",
    de: "Allemand",
    it: "Italien",
  },

  // -------------------------
  // Navigation Bar
  // -------------------------
  nav: {
    translate: "Traduire",
    library: "Bibliothèque",
    preferences: "Préférences",
    signIn: "Se connecter",
  },

  // -------------------------
  // Upload Page
  // -------------------------
  upload: {
    original: "Original",
    translation: "Traduction",
    sampleText: "Texte d'exemple",
    selectSample: "Sélectionnez un exemple",
    title: "Titre",
    untitledDocument: "Document sans titre",
    typeText: "Saisissez du texte en {lang}...",
    dragDrop: "Glissez-déposez des fichiers ici, ou cliquez pour parcourir",
    translate: "Traduire",
    uploadHint: "Collez du texte ou importez un fichier à traduire",
  },

  // -------------------------
  // Reader Page
  // -------------------------
  reader: {
    // ---- ( Blur-mode Toggle )
    blurModeToggle: {
      header: {
        prefix: "Basculer la visibilité du texte",
        highlight: "original",
        suffix: "par",
      },
      word: "Mot",
      sentence: "Phrase",
      paragraph: "Paragraphe",
    },
    
    // ---- ( Help Popover )
    helpPopover: {
      header: "Navigation et Interactions",
      // -- Page navigation
      pageNav: {
        header: "Navigation des pages",
        prevPage: "Page précédente",
        nextPage: "Page suivante",
      },
      // -- Reveal / hide original text
      sourceNav: {
        header: {
          prefix: "Afficher / masquer le texte",
          highlight: "original",
          suffix: "",
        },
        revealSent: "Afficher la phrase",
        hideSent: "Masquer la phrase",
        revealPar: "Afficher le paragraphe",
        hidePar: "Masquer le paragraphe",
      },
      // -- Click original words to toggle visibility
      sourceClick: {
        header: {
          prefix: "Cliquez sur les mots de l'",
          highlight: "original",
          suffix: "pour basculer la visibilité",
        },
        toggleVis: "Basculer la visibilité",
      },
      // -- Click translated words for info
      targetClick: {
        header: {
          prefix: "Cliquez sur les mots",
          highlight: "traduits",
          suffix: "pour obtenir des informations",
        },
        defineAndExplain: "Définition et explication",
        close: "Fermer",
      },
      // -- Click IPA to hear pronunciation
      ipaClick: {
        header: {
          prefix: "Cliquez sur",
          highlight: "IPA",
          suffix: "pour entendre la prononciation",
        },
        playPronunciation: "Lire la prononciation",
      },
    },

    // ---- ( Annotation Card )
    annotationCard: {
      baseForm: "Forme de base",
      sentence: "Phrase",
      paragraph: "Paragraphe",
      saveDefinition: "Enregistrer la définition",
      defUnavailable: "Définition non disponible",
    },

    // ---- ( General UI )
    general: {
      showOriginal: "Afficher l'original",
      hideOriginal: "Masquer l'original",
      page: "Page",
    },
  },

  // -------------------------
  // Library Page
  // -------------------------
  library: {
    // ---- ( General UI )
    all: "Tout",
    texts: "Textes",
    translations: "Traductions",
    glossary: "Glossaire",
  }
} satisfies MessagesSchema;

// =========================
// ( German )
// =========================
export const de = {
  // -------------------------
  // Languages
  // -------------------------
  langs: {
    en: "Englisch",
    es: "Spanisch",
    fr: "Französisch",
    de: "Deutsch",
    it: "Italienisch",
  },

  // -------------------------
  // Navigation Bar
  // -------------------------
  nav: {
    translate: "Übersetzen",
    library: "Bibliothek",
    preferences: "Einstellungen",
    signIn: "Anmelden",
  },

  // -------------------------
  // Upload Page
  // -------------------------
  upload: {
    original: "Original",
    translation: "Übersetzung",
    sampleText: "Beispieltext",
    selectSample: "Wähle ein Beispiel",
    title: "Titel",
    untitledDocument: "Unbenanntes Dokument",
    typeText: "Gib einen Text auf {lang} ein...",
    dragDrop: "Dateien hierher ziehen und ablegen oder klicken, um auszuwählen",
    translate: "Übersetzen",
    uploadHint: "Text einfügen oder eine Datei hochladen, um zu übersetzen",
  },

  // -------------------------
  // Reader Page
  // -------------------------
  reader: {
    // ---- ( Blur-mode Toggle )
    blurModeToggle: {
      header: {
        prefix: "Sichtbarkeit des",
        highlight: "Originaltexts",
        suffix: "umschalten nach",
      },
      word: "Wort",
      sentence: "Satz",
      paragraph: "Absatz",
    },
    
    // ---- ( Help Popover )
    helpPopover: {
      header: "Navigation und Interaktionen",
      // -- Page navigation
      pageNav: {
        header: "Seitennavigation",
        prevPage: "Vorherige Seite",
        nextPage: "Nächste Seite",
      },
      // -- Reveal / hide original text
      sourceNav: {
        header: {
          prefix: "",
          highlight: "Originaltext",
          suffix: "einblenden / ausblenden",
        },
        revealSent: "Satz einblenden",
        hideSent: "Satz ausblenden",
        revealPar: "Absatz einblenden",
        hidePar: "Absatz ausblenden",
      },
      // -- Click original words to toggle visibility
      sourceClick: {
        header: {
          prefix: "Auf Wörter im",
          highlight: "Original",
          suffix: "klicken, um die Sichtbarkeit umzuschalten",
        },
        toggleVis: "Sichtbarkeit umschalten",
      },
      // -- Click translated words for info
      targetClick: {
        header: {
          prefix: "Auf",
          highlight: "übersetzte",
          suffix: "Wörter klicken, um Infos zu sehen",
        },
        defineAndExplain: "Definition und Erklärung",
        close: "Schließen",
      },
      // -- Click IPA to hear pronunciation
      ipaClick: {
        header: {
          prefix: "Auf",
          highlight: "IPA",
          suffix: "klicken, um die Aussprache zu hören",
        },
        playPronunciation: "Aussprache abspielen",
      },
    },

    // ---- ( Annotation Card )
    annotationCard: {
      baseForm: "Grundform",
      sentence: "Satz",
      paragraph: "Absatz",
      saveDefinition: "Definition speichern",
      defUnavailable: "Definition nicht verfügbar",
    },

    // ---- ( General UI )
    general: {
      showOriginal: "Original anzeigen",
      hideOriginal: "Original ausblenden",
      page: "Seite",
    },
  },

  // -------------------------
  // Library Page
  // -------------------------
  library: {
    // ---- ( General UI )
    all: "Alle",
    texts: "Texte",
    translations: "Übersetzungen",
    glossary: "Glossar",
  }
} satisfies MessagesSchema;

// =========================
// ( Italian )
// =========================
export const it = {
  // -------------------------
  // Languages
  // -------------------------
  langs: {
    en: "Inglese",
    es: "Spagnolo",
    fr: "Francese",
    de: "Tedesco",
    it: "Italiano",
  },

  // -------------------------
  // Navigation Bar
  // -------------------------
  nav: {
    translate: "Traduci",
    library: "Biblioteca",
    preferences: "Preferenze",
    signIn: "Accedi",
  },

  // -------------------------
  // Upload Page
  // -------------------------
  upload: {
    original: "Originale",
    translation: "Traduzione",
    sampleText: "Testo di esempio",
    selectSample: "Seleziona un esempio",
    title: "Titolo",
    untitledDocument: "Documento senza titolo",
    typeText: "Scrivi del testo in {lang}...",
    dragDrop: "Trascina e rilascia i file qui, oppure fai clic per sfogliare",
    translate: "Traduci",
    uploadHint: "Incolla del testo o carica un file da tradurre",
  },

  // -------------------------
  // Reader Page
  // -------------------------
  reader: {
    // ---- ( Blur-mode Toggle )
    blurModeToggle: {
      header: {
        prefix: "Attiva/disattiva la visibilità del testo",
        highlight: "originale",
        suffix: "per",
      },
      word: "Parola",
      sentence: "Frase",
      paragraph: "Paragrafo",
    },
    
    // ---- ( Help Popover )
    helpPopover: {
      header: "Navigazione e Interazioni",
      // -- Page navigation
      pageNav: {
        header: "Navigazione delle pagine",
        prevPage: "Pagina precedente",
        nextPage: "Pagina successiva",
      },
      // -- Reveal / hide original text
      sourceNav: {
        header: {
          prefix: "Mostra / nascondi il testo",
          highlight: "originale",
          suffix: "",
        },
        revealSent: "Mostra frase",
        hideSent: "Nascondi frase",
        revealPar: "Mostra paragrafo",
        hidePar: "Nascondi paragrafo",
      },
      // -- Click original words to toggle visibility
      sourceClick: {
        header: {
          prefix: "Fai clic sulle parole dell'",
          highlight: "originale",
          suffix: "per attivare/disattivare la visibilità",
        },
        toggleVis: "Attiva/disattiva visibilità",
      },
      // -- Click translated words for info
      targetClick: {
        header: {
          prefix: "Fai clic sulle parole",
          highlight: "tradotte",
          suffix: "per informazioni",
        },
        defineAndExplain: "Definizione e spiegazione",
        close: "Chiudi",
      },
      // -- Click IPA to hear pronunciation
      ipaClick: {
        header: {
          prefix: "Fai clic su",
          highlight: "IPA",
          suffix: "per ascoltare la pronuncia",
        },
        playPronunciation: "Riproduci pronuncia",
      },
    },

    // ---- ( Annotation Card )
    annotationCard: {
      baseForm: "Forma base",
      sentence: "Frase",
      paragraph: "Paragrafo",
      saveDefinition: "Salva definizione",
      defUnavailable: "Definizione non disponibile",
    },

    // ---- ( General UI )
    general: {
      showOriginal: "Mostra originale",
      hideOriginal: "Nascondi originale",
      page: "Pagina",
    },
  },

  // -------------------------
  // Library Page
  // -------------------------
  library: {
    // ---- ( General UI )
    all: "Tutto",
    texts: "Testi",
    translations: "Traduzioni",
    glossary: "Glossario",
  }
} satisfies MessagesSchema;


// =========================
// ( messages, UiLang )
// -- Export all messages together keyed by UiLang 
// =========================
export const messages = {
  en,
  es,
  fr,
  de,
  it,
} as const;

// =========================
// ( UiLang, UI_Langs )
// -- UiLang: Key type of the available lang codes in messages
// -- UI_LANGS: List of available lang codes in messages
// =========================
export type UiLang = keyof typeof messages; 
export type LangLabels = (typeof messages)[UiLang]["langs"];

export const UI_LANGS = Object.keys(messages) as UiLang[]; // ["en", "es", "fr", ...]
export const UI_LANGS_MAP = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
]

/**************************
 * `getUiLangsMap()`
 * -- Given a selected UI lang, returns the code -> label mapping in that language
 * 
 * @param uiLang - Selected UI language code (e.g., "en", "es", "fr", ...)
 * @returns Mapping from lang code -> label in given UI language
 **************************/
export function getUiLangsMap(
  uiLang: UiLang,
) {
  return UI_LANGS.map(code => ({
    code,
    label: messages[uiLang].langs[code],
  }))
}

/**************************
 * `isUiLang()`
 * -- Verifies if a given string is a supported UI language
 * 
 * @param value - string to be tested
 * @returns true or false if the given string is a supported UI language
**************************/
export function isUiLang(value: string): value is UiLang {
  return UI_LANGS.includes(value as UiLang);
}

/**************************
 * `getLangLabel()`
 * -- Checks if the lang code is a supported UI language
 *      true: returns language label 
 *      false: returns code
 * 
 * @param 
 * @returns 
 **************************/
export function getLangLabel(
  code: string,
  langs: Record<UiLang, string>,
) {
  return isUiLang(code) ? langs[code] : code;
}

/**************************
 * `toUiLang()`
 * -- Converts a string to a UiLang if supported, otherwise returns "en"
 **************************/
export function toUiLang(value: string) {
  return value && isUiLang(value) ? value : "en";
}
