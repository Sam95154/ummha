# Noor-ul-Islam — Islamic website prototype

A responsive, single-page prototype with an emerald/ivory/gold theme, animated hero, prayer-time calculation UI, Surah navigation, bookmarks, Tasbih, multilingual navigation, and a local Quran dataset importer/validator.

## Run locally

Open dist/noor-ul-islam-prototype.html in a modern browser for a quick preview. External Google Fonts need internet access; the rest of the prototype is bundled in the HTML file.

For editable source, open a terminal in this folder and run:

    python build.py

Then open dist/noor-ul-islam-prototype.html. To serve index.html and source files from this folder:

    python -m http.server 8000

Open http://localhost:8000.

## Quran data import

In the Quran reader choose “Choose Quran JSON or Tanzil TXT” and select a local file. The browser checks its structure and displays a report. The selected file stays in browser memory and is not uploaded. See QURAN-DATASET-FORMAT.md for the supported schema and limitations.

## Current status

The interface is a prototype. Complete Quran data is not bundled. English/Urdu translations, transliteration, Dua text, Hadith text, Asma ul Husna meanings, Namaz instructions, audio, and verified Juz boundaries are not connected. Prayer-time formulas and time zones require review before use for worship.

The validator checks structure and sequence, not independently verified textual authenticity, translation accuracy, or licensing.

## Data integrity and licensing

- Intended Arabic source: Tanzil Uthmani text, to be preserved verbatim with attribution and link to https://tanzil.net, subject to current terms.
- English/Urdu translations: permission for the specific edition and distribution must be confirmed.
- Transliteration, audio, Hadith, Duas, and Names of Allah: source and license are still to be selected and verified.

Do not publish the prototype with placeholders represented as real religious content.

## Download and validate the actual Tanzil Arabic dataset

Run this from the noor folder on a computer with internet access:

    python download_validate_tanzil.py

It requests Uthmani, UTF-8, verse-numbered text from the official Tanzil endpoint, saves the response bytes unchanged to data/source/tanzil-uthmani.txt, checks 114 Surahs, 6,236 Ayahs, per-Surah counts, sequential Ayah numbers, and non-empty Arabic text. If checks pass, it writes separate reader JSON and a JSON report.

If the endpoint returns HTML instead of a text file, download Uthmani / UTF-8 / verse-numbered TXT manually from https://tanzil.net/download/, save as data/source/tanzil-uthmani.txt, and run:

    python download_validate_tanzil.py --validate-only

No actual Tanzil dataset is bundled yet, and no real dataset validation has been claimed. Run the script against the actual downloaded text and inspect the report before calling the Quran data verified. Keep the original text unchanged and retain required Tanzil attribution and link.