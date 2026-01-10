import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type BlurMode = "word" | "sentence" | "paragraph";

export function BlurModeToggle({
    value,
    onChange
}: {
    value: BlurMode;
    onChange: (v: BlurMode) => void;
}) {
    return (
        <ToggleGroup
            type="single"
            value={value}
            onValueChange={(v) => {
                if (!v) return;
                onChange(v as BlurMode);
            }}
        >
            <ToggleGroupItem value="word">
                Word
            </ToggleGroupItem>
            <ToggleGroupItem value="sentence">
                Sentence
            </ToggleGroupItem>
            <ToggleGroupItem value="paragraph">
                Paragraph
            </ToggleGroupItem>
        </ToggleGroup>
    )
}