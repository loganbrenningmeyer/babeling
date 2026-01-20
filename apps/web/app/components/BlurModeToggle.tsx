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
        className={className}
        >
            <ToggleGroupItem value="word">
                Word
            </ToggleGroupItem>
            <ToggleGroupItem value="sentence" className="border-l">
                Sentence
            </ToggleGroupItem>
            <ToggleGroupItem value="paragraph" className="border-l">
                Paragraph
            </ToggleGroupItem>
        </ToggleGroup>
    )
}