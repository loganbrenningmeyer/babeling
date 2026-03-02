import requests
from pathlib import Path


def download_epub(epub_url: str, save_path: str):
    save_path = Path(save_path)

    with requests.get(epub_url, stream=True, timeout=30) as r:
        r.raise_for_status()

        with open(save_path, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                if chunk:  # filter out keep-alive chunks
                    f.write(chunk)

    print(f"Saved to {save_path}")


def main():
    url = "https://gutendex.com/books/"
    params = {
        "search": "dostoyevsky",
        "languages": "en",
    }

    response = requests.get(url, params=params)
    response.raise_for_status()

    data = response.json()

    epub_url = data["results"][0]["formats"]["application/epub+zip"]

    save_path = "./test.epub"

    download_epub(epub_url, save_path)


if __name__ == "__main__":
    main()