import torch

from binaryalign.tokenization import BinaryAlignTokenizer, Segmenter
from binaryalign.models import BinaryAlignModel, BinaryAlignClassifier, load_backbone
from binaryalign.inference import BinaryAlign, AlignmentData
from babeling_nlp.schemas.align import AlignedParagraph


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
        paragraphs: list[AlignedParagraph], 
        src_segmenter: Segmenter,
        tgt_segmenter: Segmenter,
        threshold: float = 0.5,
    ) -> AlignmentData:
        """


        Args:


        Returns:

        """
        return self.binaryalign.align_segmented_pair(
            paragraphs=paragraphs,
            src_segmenter=src_segmenter,
            tgt_segmenter=tgt_segmenter, 
            threshold=threshold,
        )
