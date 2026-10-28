# Quran dataset import format

The prototype can import a local UTF-8 JSON file from the Quran reader. The file stays in your browser session; it is not uploaded to a server.

## Required structure

The importer accepts a root object with a `surahs` array (or `chapters` array). Each Surah must have `no`, `name`, `count`, and `ayahs`. Every Ayah must have sequential `n` plus Arabic text in `ar`. Optional translation fields are `tr` (Roman transliteration), `en` (English translation), and `ur` (Urdu translation).

```json
{
  "source": {
    "name": "Dataset source name",
    "url": "https://example.org/source",
    "license": "Exact license name and version"
  },
  "surahs": [
    {
      "no": 1,
      "name": "Surah name",
      "count": 7,
      "ayahs": [
        {
          "n": 1,
          "ar": "",
          "tr": "",
          "en": "",
          "ur": ""
        }
      ]
    }
  ]
}
```

This is a schema example only, not Quran content. Do not publish the example or fill it with generated sacred text.

## What the validator checks

- 114 Surah records in order.
- 6,236 Ayah records in total.
- Per-Surah counts against the prototype's current metadata.
- Sequential Ayah IDs starting at 1 in each Surah.
- Non-empty Arabic text for every Ayah.
- Completeness counts for transliteration and English/Urdu translation.
- Presence of source name, source URL, and license metadata (warnings if missing).

## What it cannot prove

A structural pass does not independently prove that the Arabic text exactly matches Tanzil or a printed Mushaf, that translations are accurate, or that a license permits your intended distribution. Confirm provenance and license terms separately before public release.