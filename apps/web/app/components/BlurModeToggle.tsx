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
            <ToggleGroupItem value="word" className="w-full">
                Word
            </ToggleGroupItem>
            <ToggleGroupItem value="sentence" className="w-full border-l">
                Sentence
            </ToggleGroupItem>
            <ToggleGroupItem value="paragraph" className="w-full border-l">
                Paragraph
            </ToggleGroupItem>
        </ToggleGroup>
    )
}