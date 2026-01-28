import spacy

nlp = spacy.load("en_core_web_sm", exclude=["parser"])
nlp.enable_pipe("senter")

print(nlp.pipe_names)

nlp = spacy.load("fr_core_news_sm", exclude=["parser"])
nlp.enable_pipe("senter")

print(nlp.pipe_names)