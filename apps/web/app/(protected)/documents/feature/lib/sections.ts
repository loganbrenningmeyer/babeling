import type { LoadedSection } from "../types/document";

function getSectionSpan(section: LoadedSection): number {
  return Math.max(1, section.lastPageNumber - section.firstPageNumber + 1);
}

export function getCurrentDisplaySectionIds(
  currentPageNumber: number,
  sections: LoadedSection[],
): Set<number> {
  return new Set(
    sections
      .filter((section) => (
        currentPageNumber >= section.firstPageNumber &&
        currentPageNumber <= section.lastPageNumber
      ))
      .map((section) => section.id),
  );
}

export function getCurrentDisplaySection(
  currentPageNumber: number,
  sections: LoadedSection[],
): LoadedSection | null {
  const matchingSectionIds = getCurrentDisplaySectionIds(currentPageNumber, sections);
  const matchingSections = sections.filter((section) => matchingSectionIds.has(section.id));

  if (!matchingSections.length) return null;

  const leafSections = matchingSections.filter((section) => (
    !matchingSections.some((other) => other.parentSectionId === section.id)
  ));

  const candidates = leafSections.length ? leafSections : matchingSections;

  return [...candidates].sort((a, b) => {
    const spanDiff = getSectionSpan(a) - getSectionSpan(b);
    if (spanDiff !== 0) return spanDiff;
    if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex;
    return b.depth - a.depth;
  })[0] ?? null;
}

export function getCurrentDisplaySectionId(
  currentPageNumber: number,
  sections: LoadedSection[],
): number | null {
  return getCurrentDisplaySection(currentPageNumber, sections)?.id ?? null;
}
