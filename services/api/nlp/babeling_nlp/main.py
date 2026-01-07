from translate import Translator
from align import Aligner


def main():
    model_name = "microsoft/mdeberta-v3-base"
    ckpt_path = "checkpoints/model-finetune-step55000.ckpt"

    translator = Translator()
    aligner = Aligner(model_name, ckpt_path)

    src_sentence = "The Wanderer continued its quiet magic, always by her side, its plain canvas holding infinite wonders."
    tgt_sentence = translator.translate_en_fr(src_sentence)

    print(f"source: {src_sentence}")
    print(f"target: {tgt_sentence}")

    src_words, tgt_words, alignments = aligner.align(src_sentence, tgt_sentence, 0.5)
    for (src_idx, src_word) in alignments:
        print(f"({src_idx}) {src_word}: {[(i, tgt_word, s) for i, tgt_word, s in alignments[(src_idx, src_word)]]}")


if __name__ == "__main__":
    main()