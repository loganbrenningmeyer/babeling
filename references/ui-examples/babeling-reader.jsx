import { useState, useRef, useEffect } from "react";

const BOOK_DATA = {
  title: "The Little Prince",
  author: "Antoine de Saint-Exupéry",
  chapters: [
    {
      id: 1,
      title: "Chapter I",
      subtitle: "The Boa Constrictor",
      image: null,
      imageCaption: null,
      content: [
        {
          en: "Once when I was six years old I saw a magnificent picture in a book about the Primeval Forest called 'True Stories from Nature.' It showed a boa constrictor in the act of swallowing an animal.",
          fr: "Lorsque j'avais six ans j'ai vu, une fois, une magnifique image, dans un livre sur la Forêt Vierge qui s'appelait « Histoires Vécues ». Ça représentait un serpent boa qui avalait un fauve.",
        },
        {
          en: "In the book it said: 'Boa constrictors swallow their prey whole, without chewing it. After that they are not able to move, and they sleep through the six months that they need for digestion.'",
          fr: "Voilà la copie du dessin. On disait dans le livre: « Les serpents boas avalent leur proie tout entière, sans la mâcher. Ensuite ils ne peuvent plus bouger et ils dorment pendant les six mois de leur digestion ».",
        },
        {
          en: "I pondered deeply, then, over the adventures of the jungle. And after some work with a coloured pencil I succeeded in making my first drawing. My Drawing Number One.",
          fr: "J'ai alors beaucoup réfléchi sur les aventures de la jungle et, à mon tour, j'ai réussi, avec un crayon de couleur, à tracer mon premier dessin. Mon dessin numéro 1.",
        },
      ],
    },
    {
      id: 2,
      title: "Chapter II",
      subtitle: "The Little Prince Arrives",
      image: "https://upload.wikimedia.org/wikipedia/en/0/05/Littleprince.JPG",
      imageCaption: "The little prince on his asteroid B-612",
      content: [
        {
          en: "He answered, 'No matter. Draw me a sheep.'",
          fr: "Il répondit : « Peu importe. Dessine-moi un mouton. »",
        },
        {
          en: "But I had no experience of drawing a sheep. So I drew for him the thing I so frequently drew – the boa constrictor from the outside. And I was surprised to hear, 'No, no, no! I do not want a boa constrictor with an elephant in its stomach. A boa constrictor is very dangerous and an elephant too bulky. Everything is very small where I come from. A sheep will be more suitable. Draw me a sheep.'",
          fr: "Mais je n'avais aucune expérience du dessin d'un mouton. Alors je dessinai pour lui la chose que je dessinais si fréquemment – le boa de l'extérieur. Et je fus surpris d'entendre : « Non, non, non ! Je ne veux pas d'un boa avec un éléphant dans son estomac. Un boa est très dangereux et un éléphant trop encombrant. Tout est très petit là d'où je viens. Un mouton sera plus approprié. Dessine-moi un mouton. »",
        },
        {
          en: "So I made this drawing.",
          fr: "Alors je fis ce dessin :",
        },
        {
          en: "He looked at it carefully and said, 'This won't do. The sheep looks ill. Draw me another.'",
          fr: "Il le regarda attentivement et dit : « Ça ne va pas. Ce mouton a l'air malade. Dessine-m'en un autre. »",
        },
        {
          en: "My friend smiled kindly. 'See for yourself,' he said. 'It is a ram with horns, not a sheep.'",
          fr: "Mon ami sourit avec bonté. « Vois par toi-même », dit-il. « C'est un bélier avec des cornes, pas un mouton. »",
        },
      ],
    },
    {
      id: 3,
      title: "Chapter III",
      subtitle: "The Asteroid B-612",
      image: null,
      imageCaption: null,
      content: [
        {
          en: "It took me a long time to learn where he came from. The little prince, who asked me so many questions, never seemed to hear the ones I asked him.",
          fr: "J'ai ainsi appris une seconde chose très importante : c'est que sa planète d'origine était à peine plus grande qu'une maison !",
        },
        {
          en: "It was from words dropped by chance that, little by little, everything was revealed to me. The first time he saw my aeroplane, he asked me, 'What is that object?'",
          fr: "Ce fut par hasard, au cours de ses confidences, que j'appris sa planète natale. La première fois il me dit simplement : « C'est un beau problème que la planète d'où je viens est guère plus grande qu'une maison. »",
        },
        {
          en: "I had been thinking hard about the problems of our world; and I answered him with the important matter of the baobabs and their danger.",
          fr: "J'avais ainsi appris une chose très importante : sa planète natale était à peine plus grande qu'une maison. Cela ne pouvait pas m'étonner beaucoup.",
        },
      ],
    },
    {
      id: 4,
      title: "Chapter IV",
      subtitle: "The Rose",
      image: null,
      imageCaption: null,
      content: [
        {
          en: "I had also just time to save one thing. At the moment of departure, the little prince gave me a gift. It was a laugh as pure as a fountain.",
          fr: "J'avais aussi le temps de sauver une seule chose. Au moment du départ, le petit prince m'offrit un cadeau. C'était un rire aussi pur qu'une fontaine.",
        },
        {
          en: "'You know,' he said, 'my flower... I am responsible for her. And she is so weak! She has four thorns to defend herself against the world.'",
          fr: "« Tu sais », dit-il, « ma fleur... j'en suis responsable ! Et elle est si faible ! Elle a quatre épines pour se défendre contre le monde. »",
        },
      ],
    },
  ],
};

const GRANULARITY_OPTIONS = ["Blur", "Word", "Sentence", "Paragraph"];

export default function BabelingReader() {
  const [activeChapter, setActiveChapter] = useState(1);
  const [showOriginal, setShowOriginal] = useState(true);
  const [tocOpen, setTocOpen] = useState(false);
  const [granularity, setGranularity] = useState("Sentence");
  const [highlightedPara, setHighlightedPara] = useState(null);
  const [language] = useState("French");
  const chapterRefs = useRef({});
  const contentRef = useRef(null);

  const currentChapter = BOOK_DATA.chapters.find((c) => c.id === activeChapter);
  const totalChapters = BOOK_DATA.chapters.length;

  const scrollToChapter = (id) => {
    setActiveChapter(id);
    setTocOpen(false);
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goNext = () => {
    if (activeChapter < totalChapters) scrollToChapter(activeChapter + 1);
  };
  const goPrev = () => {
    if (activeChapter > 1) scrollToChapter(activeChapter - 1);
  };

  const getBlurStyle = (text) => {
    if (granularity === "Blur") return { filter: "blur(5px)", userSelect: "none", cursor: "pointer", transition: "filter 0.2s" };
    return {};
  };

  return (
    <div style={styles.root}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>✕</span>
            <span style={styles.logoText}>Babeling</span>
          </div>
        </div>
        <nav style={styles.headerNav}>
          <button style={styles.navBtn}>
            <span>⇄</span> Translate
          </button>
          <button style={styles.navBtn}>
            <span>☰</span> Library
          </button>
        </nav>
        <div style={styles.headerRight}>
          <div style={styles.langPill}>{language} ▾</div>
          <div style={styles.avatar}>L</div>
        </div>
      </header>

      {/* Book Title Bar */}
      <div style={styles.titleBar}>
        <button style={styles.tocTrigger} onClick={() => setTocOpen(!tocOpen)}>
          ☰ Contents
        </button>
        <span style={styles.bookTitle}>{BOOK_DATA.title}</span>
        <span style={styles.bookAuthor}>by {BOOK_DATA.author}</span>
      </div>

      {/* TOC Drawer */}
      {tocOpen && (
        <div style={styles.tocOverlay} onClick={() => setTocOpen(false)}>
          <div style={styles.tocDrawer} onClick={(e) => e.stopPropagation()}>
            <div style={styles.tocHeader}>
              <span style={styles.tocTitle}>Table of Contents</span>
              <button style={styles.tocClose} onClick={() => setTocOpen(false)}>✕</button>
            </div>
            <div style={styles.tocBook}>
              <div style={styles.tocBookTitle}>{BOOK_DATA.title}</div>
              <div style={styles.tocBookAuthor}>{BOOK_DATA.author}</div>
            </div>
            <ul style={styles.tocList}>
              {BOOK_DATA.chapters.map((ch) => (
                <li
                  key={ch.id}
                  style={{
                    ...styles.tocItem,
                    ...(activeChapter === ch.id ? styles.tocItemActive : {}),
                  }}
                  onClick={() => scrollToChapter(ch.id)}
                >
                  <span style={styles.tocChNum}>{ch.title}</span>
                  <span style={styles.tocChSub}>{ch.subtitle}</span>
                  {activeChapter === ch.id && <span style={styles.tocActiveIndicator}>●</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={styles.mainArea}>
        {/* Column Headers */}
        <div style={styles.colHeaders}>
          <div style={styles.colHeader}>
            <span style={styles.colLang}>English</span>
            <div style={styles.colUnderline} />
          </div>
          <div style={styles.hideOriginalWrap}>
            <button
              style={styles.hideOrigBtn}
              onClick={() => setShowOriginal((v) => !v)}
            >
              {showOriginal ? "⊘ Hide original" : "◎ Show original"}
            </button>
          </div>
          <div style={styles.colHeader}>
            <span style={styles.colLang}>{language}</span>
            <div style={{ ...styles.colUnderline, background: "#c8a96e" }} />
          </div>
        </div>

        {/* Chapter Header */}
        <div style={styles.chapterHeader}>
          <div style={styles.chapterLabel}>{currentChapter.title}</div>
          <div style={styles.chapterSubtitle}>{currentChapter.subtitle}</div>
          <div style={styles.chapterDivider} />
        </div>

        {/* Chapter Image */}
        {currentChapter.image && (
          <div style={styles.imageRow}>
            <div style={styles.imageWrap}>
              <img
                src={currentChapter.image}
                alt={currentChapter.imageCaption}
                style={styles.chapterImage}
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
              />
              <div style={styles.imagePlaceholder}>
                <span style={styles.imagePlaceholderIcon}>🌙</span>
                <span style={styles.imagePlaceholderText}>Illustration</span>
              </div>
              {currentChapter.imageCaption && (
                <div style={styles.imageCaption}>{currentChapter.imageCaption}</div>
              )}
            </div>
          </div>
        )}

        {/* Paragraphs */}
        <div style={styles.paragraphsArea} ref={contentRef}>
          {currentChapter.content.map((para, i) => (
            <div
              key={i}
              style={{
                ...styles.paraRow,
                ...(highlightedPara === i ? styles.paraRowHighlighted : {}),
              }}
              onMouseEnter={() => setHighlightedPara(i)}
              onMouseLeave={() => setHighlightedPara(null)}
            >
              <div style={styles.paraEn}>
                <p style={styles.paraText}>{para.en}</p>
              </div>
              <div style={styles.paraDivider} />
              {showOriginal ? (
                <div style={styles.paraFr}>
                  <p
                    style={{
                      ...styles.paraText,
                      ...getBlurStyle(para.fr),
                    }}
                    onMouseEnter={(e) => {
                      if (granularity === "Blur") e.currentTarget.style.filter = "blur(0)";
                    }}
                    onMouseLeave={(e) => {
                      if (granularity === "Blur") e.currentTarget.style.filter = "blur(5px)";
                    }}
                  >
                    {para.fr}
                  </p>
                </div>
              ) : (
                <div style={styles.paraFr}>
                  <p style={{ ...styles.paraText, color: "#bbb", fontStyle: "italic" }}>
                    Original hidden
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerLeft}>
          {GRANULARITY_OPTIONS.map((g) => (
            <button
              key={g}
              style={{
                ...styles.granBtn,
                ...(granularity === g ? styles.granBtnActive : {}),
              }}
              onClick={() => setGranularity(g)}
            >
              {g}
            </button>
          ))}
        </div>
        <div style={styles.footerCenter}>
          <span style={styles.pageInfo}>
            📄 Chapter {activeChapter} / {totalChapters}
          </span>
        </div>
        <div style={styles.footerRight}>
          <button
            style={{ ...styles.navArrow, opacity: activeChapter === 1 ? 0.3 : 1 }}
            onClick={goPrev}
            disabled={activeChapter === 1}
          >
            ‹
          </button>
          <button
            style={{ ...styles.navArrow, opacity: activeChapter === totalChapters ? 0.3 : 1 }}
            onClick={goNext}
            disabled={activeChapter === totalChapters}
          >
            ›
          </button>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  root: {
    fontFamily: "'Georgia', 'Times New Roman', serif",
    background: "#f5f3ef",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    color: "#2a2520",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 28px",
    height: 52,
    background: "#fff",
    borderBottom: "1px solid #e8e4de",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  headerLeft: { display: "flex", alignItems: "center", minWidth: 140 },
  logo: { display: "flex", alignItems: "center", gap: 8 },
  logoIcon: {
    width: 28, height: 28,
    background: "#2a2520",
    color: "#fff",
    borderRadius: 6,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 13, fontWeight: 700,
    fontFamily: "sans-serif",
  },
  logoText: {
    fontSize: 17,
    fontWeight: 600,
    fontFamily: "'Georgia', serif",
    letterSpacing: "-0.02em",
    color: "#2a2520",
  },
  headerNav: { display: "flex", gap: 4 },
  navBtn: {
    background: "none", border: "none", cursor: "pointer",
    padding: "6px 14px", borderRadius: 20,
    fontSize: 13, color: "#555",
    fontFamily: "sans-serif",
    display: "flex", alignItems: "center", gap: 6,
    transition: "background 0.15s",
  },
  headerRight: { display: "flex", alignItems: "center", gap: 12, minWidth: 140, justifyContent: "flex-end" },
  langPill: {
    fontSize: 12, fontFamily: "sans-serif",
    padding: "4px 12px", borderRadius: 20,
    border: "1px solid #ddd", cursor: "pointer",
    color: "#444", background: "#fff",
  },
  avatar: {
    width: 30, height: 30,
    background: "#4a7fb5", color: "#fff",
    borderRadius: "50%", display: "flex",
    alignItems: "center", justifyContent: "center",
    fontSize: 13, fontWeight: 600,
    fontFamily: "sans-serif",
  },
  titleBar: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 12, padding: "10px 28px",
    background: "#fff", borderBottom: "1px solid #e8e4de",
    position: "relative",
  },
  tocTrigger: {
    position: "absolute", left: 28,
    background: "none", border: "none",
    cursor: "pointer", fontSize: 12,
    fontFamily: "sans-serif", color: "#666",
    padding: "4px 10px", borderRadius: 6,
    display: "flex", alignItems: "center", gap: 6,
  },
  bookTitle: {
    fontSize: 14, fontWeight: 600,
    fontFamily: "'Georgia', serif",
    color: "#2a2520",
    letterSpacing: "0.01em",
  },
  bookAuthor: {
    fontSize: 12, color: "#888",
    fontFamily: "sans-serif",
    fontStyle: "italic",
  },
  // TOC
  tocOverlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
    zIndex: 200, display: "flex", alignItems: "stretch",
  },
  tocDrawer: {
    width: 320, background: "#fff",
    boxShadow: "4px 0 24px rgba(0,0,0,0.12)",
    display: "flex", flexDirection: "column",
    padding: 0, overflowY: "auto",
  },
  tocHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "20px 24px 16px",
    borderBottom: "1px solid #eee",
  },
  tocTitle: {
    fontSize: 11, fontFamily: "sans-serif",
    letterSpacing: "0.12em", textTransform: "uppercase",
    color: "#888", fontWeight: 600,
  },
  tocClose: {
    background: "none", border: "none", cursor: "pointer",
    fontSize: 16, color: "#888", padding: 4,
  },
  tocBook: {
    padding: "20px 24px",
    borderBottom: "1px solid #eee",
    background: "#faf9f7",
  },
  tocBookTitle: {
    fontSize: 18, fontFamily: "'Georgia', serif",
    fontWeight: 600, color: "#2a2520", lineHeight: 1.3,
  },
  tocBookAuthor: {
    fontSize: 12, color: "#888", fontFamily: "sans-serif",
    fontStyle: "italic", marginTop: 4,
  },
  tocList: { listStyle: "none", margin: 0, padding: "8px 0" },
  tocItem: {
    display: "flex", flexDirection: "column",
    padding: "14px 24px",
    cursor: "pointer", borderLeft: "3px solid transparent",
    transition: "all 0.15s", position: "relative",
    borderBottom: "1px solid #f5f3ef",
  },
  tocItemActive: {
    borderLeftColor: "#c8a96e",
    background: "#fdf9f3",
  },
  tocActiveIndicator: {
    position: "absolute", right: 20, top: "50%",
    transform: "translateY(-50%)",
    color: "#c8a96e", fontSize: 8,
  },
  tocChNum: {
    fontSize: 10, fontFamily: "sans-serif",
    textTransform: "uppercase", letterSpacing: "0.1em",
    color: "#aaa", marginBottom: 3,
  },
  tocChSub: {
    fontSize: 14, fontFamily: "'Georgia', serif",
    color: "#2a2520", lineHeight: 1.4,
  },
  // Column headers
  colHeaders: {
    display: "grid", gridTemplateColumns: "1fr auto 1fr",
    padding: "0 0 0 0",
    background: "#fff",
    borderBottom: "1px solid #e8e4de",
  },
  colHeader: {
    padding: "14px 28px 0",
    display: "flex", flexDirection: "column", gap: 4,
  },
  colLang: {
    fontSize: 12, fontFamily: "sans-serif",
    color: "#444", fontWeight: 500,
  },
  colUnderline: {
    height: 2, width: 40,
    background: "#2a2520",
    borderRadius: 2, marginBottom: -1,
  },
  hideOriginalWrap: {
    display: "flex", alignItems: "flex-start",
    justifyContent: "center", padding: "12px 0",
  },
  hideOrigBtn: {
    background: "#fff", border: "1px solid #ddd",
    borderRadius: 20, padding: "5px 14px",
    fontSize: 12, fontFamily: "sans-serif",
    color: "#555", cursor: "pointer",
    display: "flex", alignItems: "center", gap: 6,
    transition: "all 0.15s",
  },
  // Chapter header
  chapterHeader: {
    textAlign: "center",
    padding: "40px 60px 20px",
    background: "#faf9f7",
  },
  chapterLabel: {
    fontSize: 11, fontFamily: "sans-serif",
    textTransform: "uppercase", letterSpacing: "0.15em",
    color: "#c8a96e", marginBottom: 8,
  },
  chapterSubtitle: {
    fontSize: 26, fontFamily: "'Georgia', serif",
    color: "#2a2520", fontWeight: 400,
    fontStyle: "italic",
    lineHeight: 1.3,
  },
  chapterDivider: {
    width: 60, height: 1, background: "#ddd",
    margin: "20px auto 0",
  },
  // Image
  imageRow: {
    display: "flex", justifyContent: "center",
    padding: "24px 60px",
    background: "#faf9f7",
    borderBottom: "1px solid #e8e4de",
  },
  imageWrap: {
    maxWidth: 320, width: "100%",
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: 0,
  },
  chapterImage: {
    width: "100%", borderRadius: 6,
    boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
    display: "block",
  },
  imagePlaceholder: {
    width: "100%", height: 200,
    background: "linear-gradient(135deg, #e8dfc8, #d4c4a0)",
    borderRadius: 6, display: "none",
    alignItems: "center", justifyContent: "center",
    flexDirection: "column", gap: 8,
    boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
  },
  imagePlaceholderIcon: { fontSize: 36 },
  imagePlaceholderText: { fontSize: 12, fontFamily: "sans-serif", color: "#888" },
  imageCaption: {
    fontSize: 11, fontFamily: "sans-serif",
    color: "#888", fontStyle: "italic",
    textAlign: "center", marginTop: 10,
    lineHeight: 1.5,
  },
  // Paragraphs
  mainArea: {
    flex: 1, overflowY: "auto",
    background: "#fff",
  },
  paragraphsArea: { padding: "8px 0" },
  paraRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1px 1fr",
    gap: 0,
    borderBottom: "1px solid #f0ede8",
    transition: "background 0.15s",
  },
  paraRowHighlighted: { background: "#fdf9f3" },
  paraEn: {
    padding: "20px 32px",
  },
  paraDivider: {
    background: "#e8e4de",
    margin: "16px 0",
  },
  paraFr: {
    padding: "20px 32px",
  },
  paraText: {
    margin: 0,
    fontSize: 15, lineHeight: 1.8,
    color: "#2a2520",
    fontFamily: "'Georgia', serif",
  },
  // Footer
  footer: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between",
    padding: "0 28px",
    height: 52,
    background: "#fff",
    borderTop: "1px solid #e8e4de",
    position: "sticky", bottom: 0,
    zIndex: 100,
  },
  footerLeft: { display: "flex", gap: 2 },
  granBtn: {
    background: "none", border: "none",
    cursor: "pointer", padding: "5px 12px",
    borderRadius: 20, fontSize: 12,
    fontFamily: "sans-serif", color: "#666",
    transition: "all 0.15s",
  },
  granBtnActive: {
    background: "#f0ede8", color: "#2a2520",
    fontWeight: 600,
  },
  footerCenter: {},
  pageInfo: {
    fontSize: 12, fontFamily: "sans-serif", color: "#888",
  },
  footerRight: { display: "flex", gap: 4 },
  navArrow: {
    width: 32, height: 32,
    background: "#2a2520", color: "#fff",
    border: "none", borderRadius: 6,
    fontSize: 18, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    lineHeight: 1, fontFamily: "sans-serif",
    transition: "opacity 0.15s",
  },
};
