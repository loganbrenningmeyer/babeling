from collections import defaultdict
from dataclasses import dataclass, field

from binaryalign.models import BinaryAlignModel
from binaryalign.tokenization import BinaryAlignTokenizer, Segmenter


@dataclass
class DomainData:
    """ """

    words: list[str] = field(default_factory=list)
    spaces: list[str] = field(default_factory=list)
    sent_ids: list[int] = field(default_factory=list)
    par_ids: list[int] = field(default_factory=list)
    sent_to_par_ids: dict[int, int] = field(default_factory=dict)
    par_to_sent_ids: dict[int, list[int]] = field(
        default_factory=lambda: defaultdict(list)
    )
    sent_to_word_ids: dict[int, list[int]] = field(
        default_factory=lambda: defaultdict(list)
    )
    par_to_word_ids: dict[int, list[int]] = field(
        default_factory=lambda: defaultdict(list)
    )


@dataclass
class AlignMaps:
    """ """

    src_to_tgt: dict[int, list[int]] = field(default_factory=dict)
    tgt_to_src: dict[int, list[int]] = field(default_factory=dict)


@dataclass
class AlignmentData:
    """ """

    src: DomainData = field(default_factory=DomainData)
    tgt: DomainData = field(default_factory=DomainData)
    align: AlignMaps = field(default_factory=AlignMaps)


class BinaryAlign:
    def __init__(
        self,
        model: BinaryAlignModel,
        tokenizer: BinaryAlignTokenizer,
    ):
        self.model = model
        self.tokenizer = tokenizer

    def align_sentence_pair(
        self, src_words: list[str], tgt_words: list[str], threshold: float = 0.1
    ) -> tuple[dict[int, list[int]], dict[int, list[int]]]:
        """


        Args:


        Returns:

        """
        # -------------------------
        # Create inputs for BinaryAlignModel
        # -------------------------
        encoding, input_ids, attention_mask, target_mask = self.create_batch(
            src_words, tgt_words
        )

        # -------------------------
        # Run inference
        # -------------------------
        preds, scores, mask = self.model.predict(
            input_ids, attention_mask, target_mask, threshold
        )

        # -- B = # source words, L = # subword tokens
        B, L = preds.shape
        src_alignments = defaultdict(list)
        tgt_alignments = defaultdict(list)

        for b in range(B):
            # -- Batch b corresponds to src_words[b]
            word_idxs = encoding.word_ids(b)

            # -- Aggregate target subword scores with max
            best_score_by_tgt = {}

            # -- Iterate through all subword token indices
            for l in range(L):
                # -------------------------
                # mask: target subword token and not padding
                # preds: classified subword token as aligned
                # -------------------------
                if mask[b, l] and preds[b, l]:
                    # -- subword token l --> target word index
                    tgt_word_idx = word_idxs[l]
                    # -- Ignore special tokens
                    if tgt_word_idx is None:
                        continue
                    # -- Logit for batch b subword token l
                    score = float(scores[b, l].item())
                    # -- Track target words' best score (max aggregation)
                    prev = best_score_by_tgt.get(tgt_word_idx, -1.0)
                    if score > prev:
                        best_score_by_tgt[tgt_word_idx] = score

            # -------------------------
            # src_alignments[src_idx] = [tgt_idx_1, tgt_idx_2, ...]
            # tgt_alignments[tgt_idx] = [src_idx_1, src_idx_2, ...]
            # -------------------------
            aligned_tgt_idxs = best_score_by_tgt.keys()

            for tgt_idx in aligned_tgt_idxs:
                src_alignments[b].append(tgt_idx)
                tgt_alignments[tgt_idx].append(b)

        return dict(src_alignments), dict(tgt_alignments)

    def align_text_pair(
        self,
        source: str,
        target: str,
        src_segmenter: Segmenter,
        tgt_segmenter: Segmenter,
        threshold: float = 0.5,
    ) -> AlignmentData:
        """about:blank#blocked


        Args:


        Returns:

        """
        out = AlignmentData()

        # -------------------------
        # Segment source / target into pars -> sents -> words
        # -------------------------
        src_par_sent_words = src_segmenter.split_par_sent_words(source)
        tgt_par_sent_words = tgt_segmenter.split_par_sent_words(target)

        for i, (src_par, tgt_par) in enumerate(zip(src_par_sent_words, tgt_par_sent_words)):
            if len(src_par) != len(tgt_par):
                print(f"----- [ MISMATCH ( Paragraph {i} ) ] -----")
                for j, src_sent in enumerate(src_par):
                    print(f"[ Source Sentence {j} ]: {' '.join(src_sent)}")
                for j, tgt_sent in enumerate(tgt_par):
                    print(f"[ Target Sentence {j} ]: {' '.join(tgt_sent)}")

        # -------------------------
        # Build one canonical token stream for rendering
        # -- This is the exact tokenization of the original text that the UI
        #    should render. Sentence-level tokenization is mapped back onto
        #    this stream so words/spaces never drift apart.
        # -------------------------
        src_full_words, src_full_spaces = src_segmenter.tokenize_with_spaces(source)
        tgt_full_words, tgt_full_spaces = tgt_segmenter.tokenize_with_spaces(target)

        out.src.words = list(src_full_words)
        out.src.spaces = list(src_full_spaces)

        out.tgt.words = list(tgt_full_words)
        out.tgt.spaces = list(tgt_full_spaces)

        # -------------------------
        # Align sentence pairs / map them onto full token stream
        # -------------------------
        src_cursor = 0
        tgt_cursor = 0

        sent_id = 0
        # -- For each paragraph...
        for par_id, (src_par, tgt_par) in enumerate(
            zip(src_par_sent_words, tgt_par_sent_words)
        ):
            # -- For words in each sentence...
            for src_words, tgt_words in zip(src_par, tgt_par):
                # -------------------------
                # Map sentence tokens to the canonical full token stream
                # -- We search from the current cursor forward so repeated
                #    words map to the correct occurrence in reading order.
                # -------------------------
                src_start, src_end = src_segmenter.find_token_span(
                    src_full_words,
                    src_words,
                    src_cursor,
                )
                tgt_start, tgt_end = tgt_segmenter.find_token_span(
                    tgt_full_words,
                    tgt_words,
                    tgt_cursor,
                )

                # -------------------------
                # Align source / target sentence pair
                # -------------------------
                src_alignments, tgt_alignments = self.align_sentence_pair(
                    src_words, tgt_words, threshold
                )

                # -------------------------
                # Update global alignments w/ src and tgt offset indices
                # -------------------------
                for src_idx, tgt_idxs in src_alignments.items():
                    tgt_idxs_global = [tgt_start + tgt_idx for tgt_idx in tgt_idxs]
                    out.align.src_to_tgt[src_start + src_idx] = tgt_idxs_global

                for tgt_idx, src_idxs in tgt_alignments.items():
                    src_idxs_global = [src_start + src_idx for src_idx in src_idxs]
                    out.align.tgt_to_src[tgt_start + tgt_idx] = src_idxs_global

                # -------------------------
                # [Source]: Assign sentence / paragraph ids
                # -------------------------
                out.src.par_to_sent_ids[par_id].append(sent_id)

                for src_idx_global in range(src_start, src_end):
                    # -- Sentence / Paragraph IDs
                    out.src.sent_ids.append(sent_id)
                    out.src.par_ids.append(par_id)
                    # -- Sentence / Paragraph IDs --> Words
                    out.src.sent_to_word_ids[sent_id].append(src_idx_global)
                    out.src.par_to_word_ids[par_id].append(src_idx_global)
                    # -- Sentence <--> Paragraph Mappings
                    out.src.sent_to_par_ids[sent_id] = par_id

                # -------------------------
                # [Target]: Assign sentence / paragraph ids
                # -------------------------
                out.tgt.par_to_sent_ids[par_id].append(sent_id)

                for tgt_idx_global in range(tgt_start, tgt_end):
                    # -- Sentence / Paragraph IDs
                    out.tgt.sent_ids.append(sent_id)
                    out.tgt.par_ids.append(par_id)
                    # -- Sentence / Paragraph IDs --> Words
                    out.tgt.sent_to_word_ids[sent_id].append(tgt_idx_global)
                    out.tgt.par_to_word_ids[par_id].append(tgt_idx_global)
                    # -- Sentence <--> Paragraph Mappings
                    out.tgt.sent_to_par_ids[sent_id] = par_id

                # -- Advance sentence id / token cursors
                sent_id += 1
                src_cursor = src_end
                tgt_cursor = tgt_end

        # -------------------------
        # Convert defaultdicts to dicts
        # -------------------------
        out.src.sent_to_word_ids = dict(out.src.sent_to_word_ids)
        out.tgt.sent_to_word_ids = dict(out.tgt.sent_to_word_ids)

        out.src.par_to_word_ids = dict(out.src.par_to_word_ids)
        out.tgt.par_to_word_ids = dict(out.tgt.par_to_word_ids)

        out.src.par_to_sent_ids = dict(out.src.par_to_sent_ids)
        out.tgt.par_to_sent_ids = dict(out.tgt.par_to_sent_ids)

        return out

    def create_batch(self, src_words: list[str], tgt_words: list[str]):
        """


        Args:


        Returns:

        """
        # -- Align for all source words
        src_idxs = list(range(len(src_words)))

        # -- Form batch for each source word
        src_batch = [src_words] * len(src_idxs)
        tgt_batch = [tgt_words] * len(src_idxs)

        # -- Mark / encode batch
        encoding = self.tokenizer.encode_marked_batch(src_batch, tgt_batch, src_idxs)

        input_ids = encoding["input_ids"].to(self.model.device)
        attention_mask = encoding["attention_mask"].to(self.model.device)
        target_mask = (encoding["token_type_ids"] == 1).to(self.model.device)

        return encoding, input_ids, attention_mask, target_mask
