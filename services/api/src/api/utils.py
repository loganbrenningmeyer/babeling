import unicodedata


def strip_control_chars(
    text: str | None,
    *,
    preserve_newlines: bool = True,
) -> str | None:
    if text is None:
        return None

    allowed = {"\t"}
    if preserve_newlines:
        allowed.update({"\n", "\r"})

    return "".join(
        ch
        for ch in text
        if ch in allowed or unicodedata.category(ch)[0] != "C"
    )


def mark_linebreaks(text: str):
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    return text.replace("\n", " <LB> ")


def remove_linebreaks(text: str):
    text = text.replace(" <LB> ", "\n").replace("<LB>", "\n")
    return text
