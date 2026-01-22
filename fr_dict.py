import requests

URL = "https://en.wiktionary.org/w/api.php"

params = {
    "action": "query",
    "prop": "revisions",
    "titles": "bread",
    "rvprop": "content",
    "rvslots": "main",
    "format": "json",
    "formatversion": 2,
}

headers = {
    # IMPORTANT: Wikimedia requires a descriptive UA. Put contact info if you can.
    "User-Agent": "babeling/0.1 (https://github.com/<yourname>/babeling; contact: you@example.com)"
}

response = requests.get(URL, params=params, headers=headers, timeout=15)
response.raise_for_status()  # raises if 403/404/500 etc.

data = response.json()

page = data["query"]["pages"][0]
wikitext = page["revisions"][0]["slots"]["main"]["content"]

print(wikitext)
