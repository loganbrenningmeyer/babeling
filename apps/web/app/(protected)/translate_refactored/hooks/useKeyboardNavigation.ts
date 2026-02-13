import { useEffect } from "react";

type UseKeyboardNavigationArgs = {
  showAligned: boolean;
  popoverOpen: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
  onPrevSentence: () => void;
  onNextSentence: () => void;
  onPrevParagraph: () => void;
  onNextParagraph: () => void;
};

export function useKeyboardNavigation({
  showAligned,
  popoverOpen,
  onPrevPage,
  onNextPage,
  onPrevSentence,
  onNextSentence,
  onPrevParagraph,
  onNextParagraph,
}: UseKeyboardNavigationArgs) {
  useEffect(() => {
    if (!showAligned) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (popoverOpen) return;

      const isArrow =
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        e.key === "ArrowUp" ||
        e.key === "ArrowDown";

      if (!isArrow) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLElement) {
        activeElement.blur();
      }

      if (e.metaKey || e.ctrlKey) {
        if (e.key === "ArrowLeft") {
          onPrevPage();
          return;
        }
        if (e.key === "ArrowRight") {
          onNextPage();
          return;
        }
      }

      if (e.key === "ArrowLeft") {
        onPrevSentence();
      } else if (e.key === "ArrowRight") {
        onNextSentence();
      } else if (e.key === "ArrowUp") {
        onPrevParagraph();
      } else if (e.key === "ArrowDown") {
        onNextParagraph();
      }
    };

    const listenerOptions: AddEventListenerOptions = { capture: true };
    window.addEventListener("keydown", onKeyDown, listenerOptions);

    return () => {
      window.removeEventListener("keydown", onKeyDown, listenerOptions);
    };
  }, [
    showAligned,
    popoverOpen,
    onPrevPage,
    onNextPage,
    onPrevSentence,
    onNextSentence,
    onPrevParagraph,
    onNextParagraph,
  ]);
}
