import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type BlurMode = "word" | "sentence" | "paragraph";

export function BlurModeToggle({
    value,
    onChange,
    className = "shadow",
}: {
    value: BlurMode;
    onChange: (v: BlurMode) => void;
    className?: string;
}) {
    return (
        <ToggleGroup
        type="single"
        value={value}
        onValueChange={(v) => {
            if (!v) return;
            onChange(v as BlurMode);
        }}
        className={`grid grid-cols-3 ${className}`}
        >
            <ToggleGroupItem
                value="word"
                className="w-full data-[state=on]:bg-blue-100"
            >
                Word
            </ToggleGroupItem>
            <ToggleGroupItem
                value="sentence"
                className="w-full border-l data-[state=on]:bg-blue-100"
            >
                Sentence
            </ToggleGroupItem>
            <ToggleGroupItem
                value="paragraph"
                className="w-full border-l data-[state=on]:bg-blue-100"
            >
                Paragraph
            </ToggleGroupItem>
        </ToggleGroup>
    )
}
