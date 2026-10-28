#!/usr/bin/env python3
"""Download the official Tanzil Uthmani verse-numbered text and validate its structure.

The downloaded source bytes are saved unchanged at data/source/tanzil-uthmani.txt.
Only after validation passes is a separate reader-friendly JSON generated.
This script does not independently prove theological authenticity; it records source
provenance and checks the file's structure against the expected Surah/Ayah counts.
"""
from __future__ import annotations
import hashlib, json, re, sys, urllib.parse, urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RAW_PATH = ROOT / "data" / "source" / "tanzil-uthmani.txt"
JSON_PATH = ROOT / "data" / "quran-uthmani-arabic.json"
REPORT_PATH = ROOT / "data" / "reports" / "tanzil-validation-report.json"
DOWNLOAD_URL = "https://tanzil.net/pub/download/index.php"
SOURCE_URL = "https://tanzil.net/"
LICENSE_URL = "https://tanzil.net/docs/Text_License"
EXPECTED_COUNTS = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6]

ATTRIBUTION = """Tanzil Quran Text (Uthmani, Version 1.1)
Copyright (C) 2007-2021 Tanzil Project
License: Creative Commons Attribution 3.0
Source: https://tanzil.net/
This text may not be modified. See https://tanzil.net/docs/Text_License
"""

def download_original() -> tuple[bytes, str | None]:
    fields = {"quranType": "uthmani", "outType": "txt-2", "marks": "true",
              "sajdah": "true", "rub": "true", "tatweel": "true", "agree": "true"}
    body = urllib.parse.urlencode(fields).encode("ascii")
    req = urllib.request.Request(
        DOWNLOAD_URL, data=body, method="POST",
        headers={"Content-Type": "application/x-www-form-urlencoded",
                 "User-Agent": "Noor-ul-Islam dataset validation/1.0"})
    with urllib.request.urlopen(req, timeout=60) as response:
        payload = response.read()
        content_type = response.headers.get("Content-Type", "")
        disposition = response.headers.get("Content-Disposition", "")
    if not payload:
        raise RuntimeError("Tanzil returned an empty response.")
    prefix = payload[:500].lstrip().lower()
    if "text/html" in content_type.lower() or prefix.startswith(b"<!doctype html") or prefix.startswith(b"<html"):
        raise RuntimeError(
            "Tanzil returned HTML instead of text. Download the Uthmani, UTF-8, verse-numbered TXT manually from "
            "https://tanzil.net/download/ and save it as data/source/tanzil-uthmani.txt, then run "
            "python download_validate_tanzil.py --validate-only")
    if b"\x00" in payload[:2048]:
        raise RuntimeError("The response looks binary rather than UTF-8 text; refusing to process it.")
    match = re.search(r'filename\*?=(?:UTF-8\'\'|\")?([^;\"\r\n]+)', disposition, re.I)
    original_name = match.group(1).strip('"') if match else None
    return payload, original_name

def parse_text(raw: bytes):
    try:
        content = raw.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise RuntimeError(f"Downloaded file is not valid UTF-8: {exc}") from exc
    rows, malformed = [], []
    for line_no, line in enumerate(content.splitlines(), start=1):
        if line.startswith("#") or not line:
            continue
        m = re.match(r"^(\d+)\|(\d+)\|(.*)$", line)
        if not m:
            malformed.append(line_no)
            if len(malformed) >= 10: break
            continue
        rows.append((int(m.group(1)), int(m.group(2)), m.group(3), line_no))
    if malformed:
        raise RuntimeError(f"Unexpected non-comment line format at line(s) {malformed}. Expected surah|ayah|Arabic.")
    return rows

def validate_rows(rows):
    errors, per_surah, arabic_missing, expected_next = [], [0]*114, [], [1]*114
    for surah_no, ayah_no, arabic, line_no in rows:
        if not 1 <= surah_no <= 114:
            errors.append(f"Line {line_no}: Surah number out of range: {surah_no}")
            continue
        i = surah_no - 1
        if ayah_no != expected_next[i]:
            errors.append(f"Surah {surah_no}: expected Ayah {expected_next[i]}, found {ayah_no} at line {line_no}")
        expected_next[i] = ayah_no + 1
        per_surah[i] += 1
        if not arabic.strip(): arabic_missing.append(f"{surah_no}:{ayah_no}")
    if len(rows) != 6236: errors.append(f"Expected 6,236 verse rows, found {len(rows)}")
    for i, (actual, expected) in enumerate(zip(per_surah, EXPECTED_COUNTS), start=1):
        if actual != expected: errors.append(f"Surah {i}: expected {expected} Ayahs, found {actual}")
    if arabic_missing: errors.append("Arabic text missing at: " + ", ".join(arabic_missing[:20]))
    return errors, per_surah

def get_names():
    data_file = ROOT / "src" / "data.js"
    if data_file.exists():
        source = data_file.read_text(encoding="utf-8")
        m = re.search(r'const raw="([^"]+)";', source)
        if m:
            names = [x.rsplit(":", 1)[0] for x in m.group(1).split("|")]
            if len(names) == 114: return names
    return [f"Surah {i}" for i in range(1, 115)]

def main():
    validate_only = "--validate-only" in sys.argv
    RAW_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    original_name = None
    if not validate_only:
        print("Downloading original Uthmani text from official Tanzil download endpoint...")
        raw, original_name = download_original()
        RAW_PATH.write_bytes(raw)
        print(f"Saved original bytes unchanged: {RAW_PATH.relative_to(ROOT)} ({len(raw):,} bytes)")
    elif not RAW_PATH.exists():
        raise RuntimeError(f"Raw file not found: {RAW_PATH}. Download it from {SOURCE_URL} first.")
    raw = RAW_PATH.read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    rows = parse_text(raw)
    errors, per_surah = validate_rows(rows)
    report = {
        "checked_at_utc": datetime.now(timezone.utc).isoformat(),
        "source": "Tanzil Project — Uthmani Quran text, verse-numbered TXT",
        "source_url": SOURCE_URL, "download_endpoint": DOWNLOAD_URL,
        "license": "Creative Commons Attribution 3.0 (Tanzil text terms apply)",
        "license_url": LICENSE_URL, "expected_surahs": 114,
        "found_surahs_with_rows": sum(1 for c in per_surah if c > 0),
        "expected_ayahs": 6236, "found_ayahs": len(rows),
        "per_surah_counts": per_surah, "raw_file": str(RAW_PATH.relative_to(ROOT)),
        "raw_file_sha256": digest, "raw_file_bytes": len(raw),
        "server_filename": original_name, "raw_file_preserved_without_edits": True,
        "structure_validation_passed": not errors, "errors": errors,
        "limitations": [
            "Count/order checks do not independently prove textual authenticity; provenance is based on official Tanzil download.",
            "Translations, transliteration, and audio licensing are separate checks.",
            "Do not edit original Tanzil text. Keep attribution and link to Tanzil in the website."
        ],
    }
    if not errors:
        names, grouped = get_names(), [[] for _ in range(114)]
        for surah_no, ayah_no, arabic, _line_no in rows:
            grouped[surah_no - 1].append({"n": ayah_no, "ar": arabic, "tr": "", "en": "", "ur": ""})
        payload = {
            "source": {"name": "Tanzil Quran Text (Uthmani, Version 1.1)", "url": SOURCE_URL,
                       "license": "Creative Commons Attribution 3.0", "licenseUrl": LICENSE_URL,
                       "attribution": ATTRIBUTION, "rawSha256": digest,
                       "note": "Arabic source copied verbatim; translations/transliteration/audio not included."},
            "surahs": [{"no": i+1, "name": names[i], "count": EXPECTED_COUNTS[i], "ayahs": grouped[i]} for i in range(114)]
        }
        JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
        JSON_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        report["derived_json"] = str(JSON_PATH.relative_to(ROOT))
        report["derived_json_created"] = True
    else:
        report["derived_json_created"] = False
    REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({k: report[k] for k in ["structure_validation_passed","expected_surahs","found_surahs_with_rows","expected_ayahs","found_ayahs","raw_file_sha256","errors","derived_json_created"] if k in report}, ensure_ascii=False, indent=2))
    print(f"Full report: {REPORT_PATH.relative_to(ROOT)}")
    if errors:
        print("Validation FAILED. No reader JSON was generated. Correct source/format and rerun.", file=sys.stderr)
        return 1
    print("Structural validation PASSED. Raw text remains unchanged; JSON is separate.")
    return 0

if __name__ == "__main__":
    try: raise SystemExit(main())
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(2)