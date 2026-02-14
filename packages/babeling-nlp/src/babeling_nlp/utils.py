def mark_words(
    words: list[str],
    mark_idxs: set[int],
    tag: str,
) -> str:
    # -------------------------
    # Replace marked words + spaces in list
    # -------------------------
    marked = []
    for i, word in enumerate(words):
        if i in mark_idxs:
            marked.append(f"<{tag}>{word}</{tag}>")
        else:
            marked.append(word)

    return marked


def extract_text_group(
    words: list[str], spaces: list[str], group_ids: list[int], group_id: int
) -> str:
    """


    Args:


    Returns:

    """
    out = []
    for i, (word, space) in enumerate(zip(words, spaces)):
        if group_ids[i] == group_id:
            out.append(word + space)
    return "".join(out)
