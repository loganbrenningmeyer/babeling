export type Cluster = {
  start: number;
  end: number;
  text: string;
  anchorLocalIndex: number;
  afterSpace: string;
};

export function buildClusters(words: string[], spaces: string[]): Cluster[] {
  const LEADING_PUNCT = new Set(['"', "'", "“", "‘", "«", "(", "[", "{"]);
  const TRAILING_PUNCT = new Set([
    ",", ".", ";", ":", "!", "?", "…", "...",
    '"', "'", "”", "’", "»",
    ")", "]", "}", "%",
  ]);

  const isInlineNoNewlineSpace = (s: string) => s === "" || /^[^\S\n]+$/.test(s);

  const isApostropheClitic = (tok: string | undefined) => {
    if (!tok) return false;
    return /^[’'][A-Za-z]+$/.test(tok);
  };

  const shouldClingNext = (nextToken: string | undefined, space: string) => {
    if (!nextToken) return false;
    if (!TRAILING_PUNCT.has(nextToken)) return false;
    return isInlineNoNewlineSpace(space);
  };

  const normalizeSpaceForPunct = (nextToken: string | undefined, space: string) => {
    if (!nextToken) return space;
    if (!TRAILING_PUNCT.has(nextToken)) return space;

    if (isInlineNoNewlineSpace(space)) {
      return space.replace(/ /g, "\u00A0").replace(/\u202F/g, "\u00A0");
    }
    return space;
  };

  const clusters: Cluster[] = [];
  let i = 0;

  while (i < words.length) {
    const start = i;
    let end = i;
    let text = words[i] ?? "";

    if (
      LEADING_PUNCT.has(words[i] ?? "") &&
      isInlineNoNewlineSpace(spaces[i] ?? "") &&
      words[i + 1] !== undefined
    ) {
      const nextToken = words[i + 1]!;
      text += (spaces[i] ?? "") + nextToken;
      end = i + 1;
    }

    while (shouldClingNext(words[end + 1], spaces[end] ?? "")) {
      const nextToken = words[end + 1] ?? "";
      const space = spaces[end] ?? "";
      text += normalizeSpaceForPunct(nextToken, space) + nextToken;
      end += 1;
    }

    while (words[end + 1] === "." && isInlineNoNewlineSpace(spaces[end] ?? "")) {
      text += (spaces[end] ?? "") + ".";
      end += 1;
    }

    while (
      /^-[A-Za-zÀ-ÖØ-öø-ÿ]{1,6}$/.test(words[end + 1] ?? "") &&
      isInlineNoNewlineSpace(spaces[end] ?? "")
    ) {
      const nextTok = words[end + 1]!;
      text += (spaces[end] ?? "") + nextTok;
      end += 1;
    }

    if (isApostropheClitic(words[end + 1]) && isInlineNoNewlineSpace(spaces[end] ?? "")) {
      const nextToken = words[end + 1]!;
      const space = spaces[end] ?? "";
      text += normalizeSpaceForPunct(nextToken, space) + nextToken;
      end += 1;
    }

    if (
      (words[end + 1] === "'" || words[end + 1] === "’") &&
      isInlineNoNewlineSpace(spaces[end] ?? "") &&
      /^[A-Za-z]{1,3}$/.test(words[end + 2] ?? "") &&
      isInlineNoNewlineSpace(spaces[end + 1] ?? "")
    ) {
      const apost = words[end + 1]!;
      const suffix = words[end + 2]!;
      text += (spaces[end] ?? "") + apost;
      text += (spaces[end + 1] ?? "") + suffix;
      end += 2;
    }

    const anchorLocalIndex =
      LEADING_PUNCT.has(words[start] ?? "") && end > start ? start + 1 : start;

    const nextTokenAfter = words[end + 1];
    const rawAfterSpace = spaces[end] ?? "";
    const afterSpace = normalizeSpaceForPunct(nextTokenAfter, rawAfterSpace);

    clusters.push({ start, end, text, anchorLocalIndex, afterSpace });
    i = end + 1;
  }

  return clusters;
}

