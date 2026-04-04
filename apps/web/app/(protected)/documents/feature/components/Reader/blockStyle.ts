export type BlockStyle = {
  wrapperClassName: string;
  textClassName: string;
  indentFirstLine: boolean;
};


export function getBlockStyle(tag: string | null): BlockStyle {
  switch (tag) {
    case "h1":
      return {
        wrapperClassName: "pt-4",
        textClassName: "text-3xl font-semibold leading-tight tracking-tight text-foreground",
        indentFirstLine: false,
      };

    case "h2":
      return {
        wrapperClassName: "pt-3",
        textClassName: "text-2xl font-semibold leading-tight tracking-tight text-foreground",
        indentFirstLine: false,
      };

    case "h3":
      return {
        wrapperClassName: "pt-2",
        textClassName: "text-xl font-semibold leading-snug text-foreground",
        indentFirstLine: false,
      };

    case "h4":
      return {
        wrapperClassName: "pt-2",
        textClassName: "text-lg font-semibold leading-snug text-foreground",
        indentFirstLine: false,
      };

    case "h5":
      return {
        wrapperClassName: "pt-1",
        textClassName: "text-base font-semibold leading-snug text-foreground",
        indentFirstLine: false,
      };

    case "h6":
      return {
        wrapperClassName: "pt-1",
        textClassName: "text-sm font-semibold leading-snug text-foreground/90",
        indentFirstLine: false,
      };

    case "blockquote":
      return {
        wrapperClassName: "border-l-2 border-border/80 pl-4",
        textClassName: "italic leading-8 text-foreground/85",
        indentFirstLine: false,
      };

    case "pre":
      return {
        wrapperClassName: "overflow-x-auto rounded-md border border-border/70 bg-muted/30 px-4 py-3",
        textClassName: "font-mono text-[0.95em] leading-7 text-foreground",
        indentFirstLine: false,
      };

    case "li":
      return {
        wrapperClassName: "pl-5",
        textClassName: "leading-8 text-inherit",
        indentFirstLine: false,
      };

    case "div":
    case "p":
    default:
      return {
        wrapperClassName: "",
        textClassName: "leading-8 text-inherit",
        indentFirstLine: true,
      };
  }
}