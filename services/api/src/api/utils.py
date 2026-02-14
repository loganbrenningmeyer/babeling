def mark_linebreaks(text: str):
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    return text.replace("\n", " <LB> ")


def remove_linebreaks(text: str):
    text = text.replace(" <LB> ", "\n").replace("<LB>", "\n")
    return text
