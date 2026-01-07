import torch

from binaryalign.tokenization import BinaryAlignTokenizer
from binaryalign.models import BinaryAlignModel, BinaryAlignClassifier, load_backbone
from binaryalign.inference.align import BinaryAlign


class Aligner:
    def __init__(self, model_name: str, ckpt_path: str):
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        tokenizer = BinaryAlignTokenizer(model_name)
        backbone = load_backbone(model_name, tokenizer.vocab_size)
        classifier = BinaryAlignClassifier(backbone.config.hidden_size)
        model = BinaryAlignModel(backbone, classifier)

        ckpt = torch.load(ckpt_path, map_location="cpu")

        model.load_state_dict(ckpt["model"])
        model.to(device)
        model.eval()

        self.binaryalign = BinaryAlign(model, tokenizer, "en", "fr")

    def align(self, src_sentence: str, tgt_sentence: str, threshold: float):
        return self.binaryalign.align(src_sentence, tgt_sentence, threshold)
