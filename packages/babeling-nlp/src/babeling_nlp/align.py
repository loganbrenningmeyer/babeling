import torch

from binaryalign.tokenization import BinaryAlignTokenizer, Segmenter
from binaryalign.models import BinaryAlignModel, BinaryAlignClassifier, load_backbone
from binaryalign.inference import BinaryAlign, AlignmentData


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

        self.binaryalign = BinaryAlign(model, tokenizer)

    def align(
        self, 
        source: str,
        target: str,
        src_lang: str,
        tgt_lang: str,
        segmenter: Segmenter,
        threshold: float=0.5,
    ) -> AlignmentData:
        """
        
        
        Args:
        
        
        Returns:
        
        """
        return self.binaryalign.align_text_pair(source, target, src_lang, tgt_lang, segmenter, threshold)
