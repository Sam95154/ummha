# Noor-ul-Islam

Quran reading prototype with tools to import and structurally validate the Tanzil Uthmani Arabic text. **The Quran text itself is not bundled or marked verified.**

## Contents

- `noor/src/` — app data, UI, and browser dataset importer/validator
- `noor/dist/noor-ul-islam-prototype.html` — standalone preview
- `noor/download_validate_tanzil.py` — download/validate utility for the official Tanzil text
- `noor/QURAN-DATASET-FORMAT.md` — dataset format notes
- `noor/README.md` — project-specific setup and dataset instructions

## Preview

Open `noor/dist/noor-ul-islam-prototype.html` locally in a browser, or enable GitHub Pages and publish `noor/dist` only if desired.

## Dataset status

The prototype currently contains metadata and placeholder/demo content. Obtain the official Tanzil Uthmani UTF-8 text, retain the source file unchanged, run the validator, and inspect its JSON validation report before considering the Quran dataset verified. See `noor/README.md` and the validator's instructions. Tanzil attribution and license terms must be retained.
