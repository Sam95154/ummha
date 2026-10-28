# Noor-ul-Islam — Islamic website prototype

A responsive single-page prototype with an emerald/ivory/gold theme, animated hero, prayer-time estimate UI, Surah navigation, bookmarks, Tasbih, multilingual navigation, and a local Quran dataset importer/validator.

## Run locally

From this folder, build the standalone preview:

    python build.py

The build script creates dist/noor-ul-islam-prototype.html. Open that file in a modern browser. External Google Fonts need internet access; the rest of the prototype is bundled into the HTML file.

To serve the editable source instead:

    python -m http.server 8000

Open http://localhost:8000.

## Quran dataset import

In the Quran reader, choose “Choose Quran JSON or Tanzil TXT” and select a local UTF-8 dataset. The browser checks the structure and displays a validation report. The selected file remains in browser memory and is not uploaded. See QURAN-DATASET-FORMAT.md for the supported schema and limitations.

## Current status

This is a prototype. Complete Quran data is not bundled. English/Urdu translations, transliteration, Dua text, Hadith text, Asma ul Husna meanings, Namaz instructions, audio, and verified Juz boundaries are not connected. Prayer-time formulas and time zones require review before use for worship.

The validator checks structure and numbering; it does not independently prove textual authenticity, scholarly correctness, translation accuracy, or licensing. Do not publish placeholders as authentic religious content.

## Data integrity and licensing

- Intended Arabic source: Tanzil Uthmani text. Preserve the original text verbatim, retain attribution, and link to https://tanzil.net under its current terms.
- English/Urdu translations: confirm permissions for the exact edition and intended distribution.
- Transliteration, audio, Hadith, Duas, and Names of Allah: sources and licenses still need selection and review.

## Download and validate the actual Tanzil Arabic dataset

Run from this noor folder on a computer with internet access:

    python download_validate_tanzil.py

The utility requests the official Uthmani, UTF-8, verse-numbered text and saves the response unchanged to data/source/tanzil-uthmani.txt. It checks the expected 114 Surahs, 6,236 Ayahs, per-Surah counts, sequential Ayah numbers, and non-empty Arabic text. If the checks pass, it writes a separate reader JSON and a JSON validation report.

If the official endpoint returns HTML rather than a text file, manually download Uthmani / UTF-8 / verse-numbered TXT from https://tanzil.net/download/, save it as data/source/tanzil-uthmani.txt, and run:

    python download_validate_tanzil.py --validate-only

**No actual Tanzil dataset is bundled yet, and no real dataset validation has been claimed.** Run the tool against the actual download and inspect the resulting report before considering the text verified. Keep the original source unchanged and retain the required Tanzil attribution and link.