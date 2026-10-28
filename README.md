# Noor-ul-Islam — نور الإسلام

A responsive Islamic website prototype with an emerald/ivory/gold theme, animated hero, Surah selector, multilingual navigation (English/Urdu/Arabic labels), Tasbih, bookmark controls, prayer-time estimate UI, and local Quran dataset importer/structural validator.

## Open the app

- The GitHub Pages entry point is [index.html](./index.html). To publish it, go to **Settings → Pages** and select **Deploy from a branch**, branch **main**, folder **/(root)**.
- The editable app source lives under [noor/](./noor/): HTML, CSS, JavaScript, build script, and dataset tools.
- [Project setup and dataset instructions](./noor/README.md)
- [Dataset format and validation limits](./noor/QURAN-DATASET-FORMAT.md)

You can also run the editable source locally. From the noor folder:

    python build.py
    python -m http.server 8000

Then open http://localhost:8000.

## Dataset status — not yet verified

The app currently ships only with Surah metadata and clearly marked demo placeholders. **No actual Tanzil Quran text is included in this repository yet, and no real Quran-text validation has been passed.**

The included [validator script](./noor/download_validate_tanzil.py) attempts to download the official Uthmani, UTF-8, verse-numbered text from Tanzil, preserves the downloaded bytes unchanged, and checks the expected 114 Surahs / 6,236 Ayahs, per-Surah counts, sequential numbering, and non-empty Arabic text. Run it locally from the noor folder:

    python download_validate_tanzil.py

If the Tanzil download form changes, follow the manual download and --validate-only instructions in the project README. Review the resulting JSON report before stating that the dataset passed validation.

## Important

Structural validation checks the file's layout and counts; it does not independently prove textual authenticity or scholarly correctness. Translations, transliteration, Hadith, Duas, audio, and prayer-time settings need their own source/license and review. Keep the required Tanzil attribution and link, and do not modify the original Tanzil text.