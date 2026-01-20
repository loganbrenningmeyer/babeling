import re


def get_token_spaces(sentence, tokens):
    """
    
    
    Args:
    
    
    Returns:
    
    """
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

def normalize_wrapped_text(text: str):
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # Split into paragraphs on blank lines
    paras = re.split(r"\n\s*\n+", text.strip())

    # De-wrap each paragraph: replace remaining newlines with spaces
    paras = [re.sub(r"\s*\n\s*", " ", p).strip() for p in paras if p.strip()]

    # Re-join paragraphs with a blank line
    return "\n\n".join(paras)

def mark_linebreaks(text: str):
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    return text.replace("\n", " <LB> ")

def remove_linebreaks(text: str):
    text = text.replace(" <LB> ", "\n").replace("<LB>", "\n")
    return text
