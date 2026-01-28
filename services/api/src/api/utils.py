import re


def get_token_spaces(sentence, tokens):
    """ """
    i = 0
    spaces = []

    for token in tokens:
        start = sentence.find(token, i)

        if start == -1:
            spaces.append("")
            continue

        end = start + len(token)

        j = end
        while j < len(sentence) and sentence[j].isspace():
            j += 1

        spaces.append(sentence[end:j])
        i = j

    return spaces


def mark_linebreaks(text: str):
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    return text.replace("\n", " <LB> ")


def remove_linebreaks(text: str):
    text = text.replace(" <LB> ", "\n").replace("<LB>", "\n")
    return text
