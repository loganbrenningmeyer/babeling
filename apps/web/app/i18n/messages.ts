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
    review: string;
    preferences: string;
    signIn: string;
  },

  // -------------------------
  // Upload Page
  // -------------------------
  upload: {
    hero: string;
    heroInfo: string;
    sourceLang: string;
    targetLang: string;
    translateAlignInfo: string;
    startReading: string;
    tabs: {
      importEbook: string;
      uploadFile: string;
      pasteText: string;
    },
    importEbook: {
      searchBy: string;
      language: string;
      author: string;
      filterByAuthor: string;
      searchGutenberg: string;
      enterTitle: string;
      booksFound: string;
      showing: string;
      prev: string;
      next: string;
    },
    uploadFile: {
      dragAndDrop: string;
      or: string;
      browseFiles: string;
    },
    pasteText: {
      pasteOrType: string;
    },
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
      helpLabel: string;
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
    toc: {
      contents: string;
      tableOfContents: string;
      readingProgress: string;
      of: string;
      goToPage: string;
      go: string;
      untitledDocument: string;
    },
    footer: {
      blur: string;
      swapSourceTarget: string;
    },
  },

  // -------------------------
  // Preferences Page
  // -------------------------
  preferences: {
    badgePersonalize: string;
    heroInfo: string;
    summarySource: string;
    summaryTarget: string;
    summaryTheme: string;
    languageDefaultsTitle: string;
    languageDefaultsInfo: string;
    preferredSourceLabel: string;
    preferredSourceDescription: string;
    preferredTargetLabel: string;
    preferredTargetDescription: string;
    interfaceLanguageLabel: string;
    interfaceLanguageDescription: string;
    appearanceTitle: string;
    appearanceInfo: string;
    quickSwitchTitle: string;
    quickSwitchDescription: string;
    noPreference: string;
    auto: string;
    themeSystem: string;
    themeLight: string;
    themeDark: string;
    themeSystemDescription: string;
    themeLightDescription: string;
    themeDarkDescription: string;
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
    hero: string;
    heroInfo: string;
    wordsSaved: string;
    continueReading: string;
    continue: string;
    continueIn: string;
    loading: string;
    searchLibrary: string;
    sortDocuments: string;
    sortGlossary: string;
    recentlyRead: string;
    titleAZ: string;
    originalLanguageAZ: string;
    recentlyAdded: string;
    wordAZ: string;
    languageAZ: string;
    documentTitleAZ: string;
    noDocuments: string;
    noTranslationsYet: string;
    progress: string;
    back: string;
    from: string;
    close: string;
    original: string;
    translation: string;
    pageAbbrev: string;
    of: string;
    pages: string;
    documentCover: string;
    error: string;
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
    review: "Review",
    preferences: "Preferences",
    signIn: "Sign In",
  },

  // -------------------------
  // Upload Page
  // -------------------------
  upload: {
    hero: "New reading",
    heroInfo: "Paste text, upload a file, or import an eBook to begin.",
    sourceLang: "Source language",
    targetLang: "Target language",
    translateAlignInfo: "Translation and alignment usually takes 15-30 seconds",
    startReading: "Start reading",
    tabs: {
      importEbook: "Import eBook",
      uploadFile: "Upload file",
      pasteText: "Paste text",
    },
    importEbook: {
      searchBy: "Search by book title or author name...",
      language: "Language",
      author: "Author",
      filterByAuthor: "Filter by author...",
      searchGutenberg: "Search Project Gutenberg",
      enterTitle: "Enter a title or author, then press Enter.",
      booksFound: "Books found",
      showing: "Showing",
      prev: "Prev",
      next: "Next",
    },
    uploadFile: {
      dragAndDrop: "Drag and drop",
      or: "or",
      browseFiles: "Browse files",
    },
    pasteText: {
      pasteOrType: "Paste or type your text here...",
    }
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
      helpLabel: "Help",
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
    toc: {
      contents: "Contents",
      tableOfContents: "Table of Contents",
      readingProgress: "Reading progress",
      of: "of",
      goToPage: "Go to page",
      go: "Go",
      untitledDocument: "Untitled document",
    },
    footer: {
      blur: "Blur",
      swapSourceTarget: "Swap source and target roles",
    },
  },

  // -------------------------
  // Preferences Page
  // -------------------------
  preferences: {
    badgePersonalize: "Personalize",
    heroInfo: "Set the default languages and appearance Babeling should use whenever you start a new reading session.",
    summarySource: "Source",
    summaryTarget: "Target",
    summaryTheme: "Theme",
    languageDefaultsTitle: "Language Defaults",
    languageDefaultsInfo: "These selections prefill the app for future uploads, reader sessions, and interface copy.",
    preferredSourceLabel: "Preferred source language",
    preferredSourceDescription: "Choose the language your original text usually starts in.",
    preferredTargetLabel: "Preferred target language",
    preferredTargetDescription: "Set the translation language you want preselected most often.",
    interfaceLanguageLabel: "Interface language",
    interfaceLanguageDescription: "This changes menus, controls, and labels throughout the app.",
    appearanceTitle: "Appearance",
    appearanceInfo: "Keep the interface synced to your device or pin it to a specific theme.",
    quickSwitchTitle: "Quick light or dark switch",
    quickSwitchDescription: "Use the toggle for fast changes, or pick a fixed mode below.",
    noPreference: "No preference",
    auto: "Auto",
    themeSystem: "System",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystemDescription: "Follow your computer or phone preference automatically.",
    themeLightDescription: "Keep the warmer daylight palette on every visit.",
    themeDarkDescription: "Use the darker contrast palette everywhere in the app.",
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
    hero: "Your library",
    heroInfo: "Texts, translations, and vocabulary you've collected.",
    wordsSaved: "Words saved",
    continueReading: "Continue reading",
    continue: "Continue",
    continueIn: "Continue in",
    loading: "Loading",
    searchLibrary: "Search library...",
    sortDocuments: "Sort documents",
    sortGlossary: "Sort glossary",
    recentlyRead: "Recently read",
    titleAZ: "Title (A-Z)",
    originalLanguageAZ: "Original language (A-Z)",
    recentlyAdded: "Recently added",
    wordAZ: "Word (A-Z)",
    languageAZ: "Language (A-Z)",
    documentTitleAZ: "Document title (A-Z)",
    noDocuments: "No documents yet. Start a reading session to save your first document.",
    noTranslationsYet: "No translations yet",
    progress: "Progress",
    back: "Back",
    from: "from",
    close: "Close",
    original: "Original",
    translation: "Translation",
    pageAbbrev: "p.",
    of: "of",
    pages: "pages",
    documentCover: "Document cover",
    error: "Error",
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
    review: "Repasar",
    preferences: "Preferencias",
    signIn: "Iniciar sesión",
  },

  // -------------------------
  // Upload Page
  // -------------------------
  upload: {
    hero: "Nueva lectura",
    heroInfo: "Pega texto, sube un archivo o importa un eBook para comenzar.",
    sourceLang: "Idioma de origen",
    targetLang: "Idioma de destino",
    translateAlignInfo: "La traducción y la alineación suelen tardar entre 15 y 30 segundos",
    startReading: "Empezar a leer",
    tabs: {
      importEbook: "Importar eBook",
      uploadFile: "Subir archivo",
      pasteText: "Pegar texto",
    },
    importEbook: {
      searchBy: "Buscar por título del libro o nombre del autor...",
      language: "Idioma",
      author: "Autor",
      filterByAuthor: "Filtrar por autor...",
      searchGutenberg: "Buscar en Project Gutenberg",
      enterTitle: "Ingresa un título o autor y luego presiona Enter.",
      booksFound: "Libros encontrados",
      showing: "Mostrando",
      prev: "Anterior",
      next: "Siguiente",
    },
    uploadFile: {
      dragAndDrop: "Arrastrar y soltar",
      or: "o",
      browseFiles: "Explorar archivos",
    },
    pasteText: {
      pasteOrType: "Pega o escribe tu texto aquí...",
    },
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
      helpLabel: "Ayuda",
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
    toc: {
      contents: "Contenido",
      tableOfContents: "Tabla de contenido",
      readingProgress: "Progreso de lectura",
      of: "de",
      goToPage: "Ir a la página",
      go: "Ir",
      untitledDocument: "Documento sin título",
    },
    footer: {
      blur: "Desenfoque",
      swapSourceTarget: "Intercambiar origen y destino",
    },
  },

  // -------------------------
  // Preferences Page
  // -------------------------
  preferences: {
    badgePersonalize: "Personaliza",
    heroInfo: "Configura los idiomas y la apariencia predeterminados que Babeling debe usar cada vez que inicies una nueva sesión de lectura.",
    summarySource: "Origen",
    summaryTarget: "Destino",
    summaryTheme: "Tema",
    languageDefaultsTitle: "Idiomas predeterminados",
    languageDefaultsInfo: "Estas selecciones rellenan la app para futuras cargas, sesiones de lectura y el texto de la interfaz.",
    preferredSourceLabel: "Idioma de origen preferido",
    preferredSourceDescription: "Elige el idioma en el que suele comenzar tu texto original.",
    preferredTargetLabel: "Idioma de destino preferido",
    preferredTargetDescription: "Define el idioma de traducción que quieres tener preseleccionado con más frecuencia.",
    interfaceLanguageLabel: "Idioma de la interfaz",
    interfaceLanguageDescription: "Esto cambia menús, controles y etiquetas en toda la app.",
    appearanceTitle: "Apariencia",
    appearanceInfo: "Mantén la interfaz sincronizada con tu dispositivo o fíjala en un tema específico.",
    quickSwitchTitle: "Cambio rápido entre claro y oscuro",
    quickSwitchDescription: "Usa el interruptor para cambios rápidos o elige un modo fijo abajo.",
    noPreference: "Sin preferencia",
    auto: "Automático",
    themeSystem: "Sistema",
    themeLight: "Claro",
    themeDark: "Oscuro",
    themeSystemDescription: "Sigue automáticamente la preferencia de tu computadora o teléfono.",
    themeLightDescription: "Mantén la paleta cálida de luz diurna en cada visita.",
    themeDarkDescription: "Usa la paleta de mayor contraste oscuro en toda la app.",
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
    hero: "Tu biblioteca",
    heroInfo: "Textos, traducciones y vocabulario que has guardado.",
    wordsSaved: "Palabras guardadas",
    continueReading: "Seguir leyendo",
    continue: "Continuar",
    continueIn: "Continuar en",
    loading: "Cargando",
    searchLibrary: "Buscar en la biblioteca...",
    sortDocuments: "Ordenar textos",
    sortGlossary: "Ordenar glosario",
    recentlyRead: "Leídos recientemente",
    titleAZ: "Título (A-Z)",
    originalLanguageAZ: "Idioma original (A-Z)",
    recentlyAdded: "Añadidos recientemente",
    wordAZ: "Palabra (A-Z)",
    languageAZ: "Idioma (A-Z)",
    documentTitleAZ: "Título del texto (A-Z)",
    noDocuments: "Aún no hay documentos. Inicia una sesión de lectura para guardar tu primer documento.",
    noTranslationsYet: "Aún no hay traducciones",
    progress: "Progreso",
    back: "Volver",
    from: "de",
    close: "Cerrar",
    original: "Original",
    translation: "Traducción",
    pageAbbrev: "p.",
    of: "de",
    pages: "páginas",
    documentCover: "Portada del documento",
    error: "Error",
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
    review: "Révision",
    preferences: "Préférences",
    signIn: "Se connecter",
  },

  // -------------------------
  // Upload Page
  // -------------------------
  upload: {
    hero: "Nouvelle lecture",
    heroInfo: "Collez du texte, téléversez un fichier ou importez un eBook pour commencer.",
    sourceLang: "Langue source",
    targetLang: "Langue cible",
    translateAlignInfo: "La traduction et l'alignement prennent généralement entre 15 et 30 secondes",
    startReading: "Commencer la lecture",
    tabs: {
      importEbook: "Importer un eBook",
      uploadFile: "Importer un fichier",
      pasteText: "Coller du texte",
    },
    importEbook: {
      searchBy: "Rechercher par titre de livre ou nom d'auteur...",
      language: "Langue",
      author: "Auteur",
      filterByAuthor: "Filtrer par auteur...",
      searchGutenberg: "Rechercher dans Project Gutenberg",
      enterTitle: "Entrez un titre ou un auteur, puis appuyez sur Entrée.",
      booksFound: "Livres trouvés",
      showing: "Affichage",
      prev: "Préc.",
      next: "Suiv.",
    },
    uploadFile: {
      dragAndDrop: "Glisser-déposer",
      or: "ou",
      browseFiles: "Parcourir les fichiers",
    },
    pasteText: {
      pasteOrType: "Collez ou saisissez votre texte ici...",
    },
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
      helpLabel: "Aide",
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
    toc: {
      contents: "Sommaire",
      tableOfContents: "Table des matières",
      readingProgress: "Progression de lecture",
      of: "sur",
      goToPage: "Aller à la page",
      go: "Aller",
      untitledDocument: "Document sans titre",
    },
    footer: {
      blur: "Flou",
      swapSourceTarget: "Inverser source et cible",
    },
  },

  // -------------------------
  // Preferences Page
  // -------------------------
  preferences: {
    badgePersonalize: "Personnalisez",
    heroInfo: "Définissez les langues et l'apparence par défaut que Babeling doit utiliser à chaque nouvelle session de lecture.",
    summarySource: "Source",
    summaryTarget: "Cible",
    summaryTheme: "Thème",
    languageDefaultsTitle: "Langues par défaut",
    languageDefaultsInfo: "Ces choix préremplissent l'application pour les futurs imports, sessions de lecture et textes d'interface.",
    preferredSourceLabel: "Langue source préférée",
    preferredSourceDescription: "Choisissez la langue dans laquelle votre texte original commence le plus souvent.",
    preferredTargetLabel: "Langue cible préférée",
    preferredTargetDescription: "Définissez la langue de traduction que vous voulez voir préselectionnée le plus souvent.",
    interfaceLanguageLabel: "Langue de l'interface",
    interfaceLanguageDescription: "Cela modifie les menus, contrôles et libellés dans toute l'application.",
    appearanceTitle: "Apparence",
    appearanceInfo: "Gardez l'interface synchronisée avec votre appareil ou fixez-la sur un thème spécifique.",
    quickSwitchTitle: "Bascule rapide clair/sombre",
    quickSwitchDescription: "Utilisez l'interrupteur pour un changement rapide, ou choisissez un mode fixe ci-dessous.",
    noPreference: "Aucune préférence",
    auto: "Auto",
    themeSystem: "Système",
    themeLight: "Clair",
    themeDark: "Sombre",
    themeSystemDescription: "Suivez automatiquement la préférence de votre ordinateur ou téléphone.",
    themeLightDescription: "Conservez la palette plus chaude en mode clair à chaque visite.",
    themeDarkDescription: "Utilisez la palette sombre à contraste renforcé dans toute l'application.",
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
    hero: "Votre bibliothèque",
    heroInfo: "Textes, traductions et vocabulaire que vous avez enregistrés.",
    wordsSaved: "Mots enregistrés",
    continueReading: "Continuer la lecture",
    continue: "Continuer",
    continueIn: "Continuer en",
    loading: "Chargement",
    searchLibrary: "Rechercher dans la bibliothèque...",
    sortDocuments: "Trier les textes",
    sortGlossary: "Trier le glossaire",
    recentlyRead: "Récemment lus",
    titleAZ: "Titre (A-Z)",
    originalLanguageAZ: "Langue d'origine (A-Z)",
    recentlyAdded: "Ajoutés récemment",
    wordAZ: "Mot (A-Z)",
    languageAZ: "Langue (A-Z)",
    documentTitleAZ: "Titre du texte (A-Z)",
    noDocuments: "Aucun document pour l'instant. Commencez une session de lecture pour enregistrer votre premier document.",
    noTranslationsYet: "Aucune traduction pour le moment",
    progress: "Progression",
    back: "Retour",
    from: "de",
    close: "Fermer",
    original: "Original",
    translation: "Traduction",
    pageAbbrev: "p.",
    of: "sur",
    pages: "pages",
    documentCover: "Couverture du document",
    error: "Erreur",
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
    review: "Wiederholen",
    preferences: "Einstellungen",
    signIn: "Anmelden",
  },

  // -------------------------
  // Upload Page
  // -------------------------
  upload: {
    hero: "Neue Lektüre",
    heroInfo: "Füge Text ein, lade eine Datei hoch oder importiere ein eBook, um zu starten.",
    sourceLang: "Ausgangssprache",
    targetLang: "Zielsprache",
    translateAlignInfo: "Übersetzung und Ausrichtung dauern in der Regel 15 bis 30 Sekunden",
    startReading: "Mit dem Lesen beginnen",
    tabs: {
      importEbook: "eBook importieren",
      uploadFile: "Datei hochladen",
      pasteText: "Text einfügen",
    },
    importEbook: {
      searchBy: "Nach Buchtitel oder Autorennamen suchen...",
      language: "Sprache",
      author: "Autor",
      filterByAuthor: "Nach Autor filtern...",
      searchGutenberg: "Project Gutenberg durchsuchen",
      enterTitle: "Gib einen Titel oder Autor ein und drücke dann Enter.",
      booksFound: "Bücher gefunden",
      showing: "Angezeigt",
      prev: "Zurück",
      next: "Weiter",
    },
    uploadFile: {
      dragAndDrop: "Ziehen und ablegen",
      or: "oder",
      browseFiles: "Dateien durchsuchen",
    },
    pasteText: {
      pasteOrType: "Füge hier deinen Text ein oder tippe ihn ein...",
    },
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
      helpLabel: "Hilfe",
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
    toc: {
      contents: "Inhalt",
      tableOfContents: "Inhaltsverzeichnis",
      readingProgress: "Lesefortschritt",
      of: "von",
      goToPage: "Gehe zu Seite",
      go: "Los",
      untitledDocument: "Unbenanntes Dokument",
    },
    footer: {
      blur: "Unschärfe",
      swapSourceTarget: "Quell- und Zielrolle tauschen",
    },
  },

  // -------------------------
  // Preferences Page
  // -------------------------
  preferences: {
    badgePersonalize: "Personalisieren",
    heroInfo: "Lege die Standardsprachen und das Erscheinungsbild fest, die Babeling bei jeder neuen Lesesitzung verwenden soll.",
    summarySource: "Quelle",
    summaryTarget: "Ziel",
    summaryTheme: "Design",
    languageDefaultsTitle: "Sprachstandards",
    languageDefaultsInfo: "Diese Einstellungen füllen die App bei künftigen Uploads, Lesesitzungen und Oberflächentexten vorab aus.",
    preferredSourceLabel: "Bevorzugte Ausgangssprache",
    preferredSourceDescription: "Wähle die Sprache, in der dein Originaltext normalerweise beginnt.",
    preferredTargetLabel: "Bevorzugte Zielsprache",
    preferredTargetDescription: "Lege die Übersetzungssprache fest, die am häufigsten vorausgewählt sein soll.",
    interfaceLanguageLabel: "Oberflächensprache",
    interfaceLanguageDescription: "Dadurch ändern sich Menüs, Bedienelemente und Beschriftungen in der gesamten App.",
    appearanceTitle: "Erscheinungsbild",
    appearanceInfo: "Halte die Oberfläche mit deinem Gerät synchron oder setze sie auf ein festes Design.",
    quickSwitchTitle: "Schneller Hell/Dunkel-Wechsel",
    quickSwitchDescription: "Nutze den Schalter für schnelle Änderungen oder wähle unten einen festen Modus.",
    noPreference: "Keine Präferenz",
    auto: "Automatisch",
    themeSystem: "System",
    themeLight: "Hell",
    themeDark: "Dunkel",
    themeSystemDescription: "Übernimm automatisch die Einstellung deines Computers oder Telefons.",
    themeLightDescription: "Behalte die hellere Tageslicht-Palette bei jedem Besuch.",
    themeDarkDescription: "Verwende die dunklere, kontrastreiche Palette in der gesamten App.",
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
    hero: "Deine Bibliothek",
    heroInfo: "Texte, Übersetzungen und Vokabeln, die du gesammelt hast.",
    wordsSaved: "Gespeicherte Wörter",
    continueReading: "Weiterlesen",
    continue: "Weiter",
    continueIn: "Weiter auf",
    loading: "Wird geladen",
    searchLibrary: "Bibliothek durchsuchen...",
    sortDocuments: "Texte sortieren",
    sortGlossary: "Glossar sortieren",
    recentlyRead: "Zuletzt gelesen",
    titleAZ: "Titel (A-Z)",
    originalLanguageAZ: "Originalsprache (A-Z)",
    recentlyAdded: "Zuletzt hinzugefügt",
    wordAZ: "Wort (A-Z)",
    languageAZ: "Sprache (A-Z)",
    documentTitleAZ: "Dokumenttitel (A-Z)",
    noDocuments: "Noch keine Dokumente. Starte eine Lesesitzung, um dein erstes Dokument zu speichern.",
    noTranslationsYet: "Noch keine Übersetzungen",
    progress: "Fortschritt",
    back: "Zurück",
    from: "aus",
    close: "Schließen",
    original: "Original",
    translation: "Übersetzung",
    pageAbbrev: "S.",
    of: "von",
    pages: "Seiten",
    documentCover: "Dokumentcover",
    error: "Fehler",
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
    review: "Ripasso",
    preferences: "Preferenze",
    signIn: "Accedi",
  },

  // -------------------------
  // Upload Page
  // -------------------------
  upload: {
    hero: "Nuova lettura",
    heroInfo: "Incolla testo, carica un file o importa un eBook per iniziare.",
    sourceLang: "Lingua di origine",
    targetLang: "Lingua di destinazione",
    translateAlignInfo: "La traduzione e l'allineamento richiedono di solito tra 15 e 30 secondi",
    startReading: "Inizia a leggere",
    tabs: {
      importEbook: "Importa eBook",
      uploadFile: "Carica file",
      pasteText: "Incolla testo",
    },
    importEbook: {
      searchBy: "Cerca per titolo del libro o nome dell'autore...",
      language: "Lingua",
      author: "Autore",
      filterByAuthor: "Filtra per autore...",
      searchGutenberg: "Cerca su Project Gutenberg",
      enterTitle: "Inserisci un titolo o un autore, poi premi Invio.",
      booksFound: "Libri trovati",
      showing: "Mostrati",
      prev: "Prec.",
      next: "Succ.",
    },
    uploadFile: {
      dragAndDrop: "Trascina e rilascia",
      or: "o",
      browseFiles: "Sfoglia file",
    },
    pasteText: {
      pasteOrType: "Incolla o scrivi qui il tuo testo...",
    },
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
      helpLabel: "Aiuto",
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
    toc: {
      contents: "Contenuti",
      tableOfContents: "Indice",
      readingProgress: "Avanzamento lettura",
      of: "di",
      goToPage: "Vai alla pagina",
      go: "Vai",
      untitledDocument: "Documento senza titolo",
    },
    footer: {
      blur: "Sfocatura",
      swapSourceTarget: "Scambia ruoli origine e destinazione",
    },
  },

  // -------------------------
  // Preferences Page
  // -------------------------
  preferences: {
    badgePersonalize: "Personalizza",
    heroInfo: "Imposta le lingue predefinite e l'aspetto che Babeling deve usare ogni volta che inizi una nuova sessione di lettura.",
    summarySource: "Origine",
    summaryTarget: "Destinazione",
    summaryTheme: "Tema",
    languageDefaultsTitle: "Lingue predefinite",
    languageDefaultsInfo: "Queste selezioni precompilano l'app per futuri caricamenti, sessioni di lettura e testo dell'interfaccia.",
    preferredSourceLabel: "Lingua di origine preferita",
    preferredSourceDescription: "Scegli la lingua in cui di solito inizia il tuo testo originale.",
    preferredTargetLabel: "Lingua di destinazione preferita",
    preferredTargetDescription: "Imposta la lingua di traduzione che vuoi trovare preselezionata più spesso.",
    interfaceLanguageLabel: "Lingua dell'interfaccia",
    interfaceLanguageDescription: "Questo cambia menu, controlli ed etichette in tutta l'app.",
    appearanceTitle: "Aspetto",
    appearanceInfo: "Mantieni l'interfaccia sincronizzata con il tuo dispositivo oppure fissala su un tema specifico.",
    quickSwitchTitle: "Cambio rapido chiaro/scuro",
    quickSwitchDescription: "Usa l'interruttore per cambi rapidi oppure scegli sotto una modalità fissa.",
    noPreference: "Nessuna preferenza",
    auto: "Auto",
    themeSystem: "Sistema",
    themeLight: "Chiaro",
    themeDark: "Scuro",
    themeSystemDescription: "Segui automaticamente la preferenza del tuo computer o telefono.",
    themeLightDescription: "Mantieni la palette più calda in modalità chiara a ogni visita.",
    themeDarkDescription: "Usa la palette scura ad alto contrasto in tutta l'app.",
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
    hero: "La tua biblioteca",
    heroInfo: "Testi, traduzioni e vocabolario che hai raccolto.",
    wordsSaved: "Parole salvate",
    continueReading: "Continua a leggere",
    continue: "Continua",
    continueIn: "Continua in",
    loading: "Caricamento",
    searchLibrary: "Cerca nella biblioteca...",
    sortDocuments: "Ordina testi",
    sortGlossary: "Ordina glossario",
    recentlyRead: "Letti di recente",
    titleAZ: "Titolo (A-Z)",
    originalLanguageAZ: "Lingua originale (A-Z)",
    recentlyAdded: "Aggiunti di recente",
    wordAZ: "Parola (A-Z)",
    languageAZ: "Lingua (A-Z)",
    documentTitleAZ: "Titolo del testo (A-Z)",
    noDocuments: "Nessun documento ancora. Avvia una sessione di lettura per salvare il tuo primo documento.",
    noTranslationsYet: "Nessuna traduzione ancora",
    progress: "Avanzamento",
    back: "Indietro",
    from: "da",
    close: "Chiudi",
    original: "Originale",
    translation: "Traduzione",
    pageAbbrev: "p.",
    of: "di",
    pages: "pagine",
    documentCover: "Copertina del documento",
    error: "Errore",
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
