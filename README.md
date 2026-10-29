# Noor Muslim Companion

The repository root contains the current static web app. It brings together the home dashboard, prayer views, Quran reader, duas, and daily tools in a mobile-friendly interface.

## Run locally

From the repository root, run:

```powershell
python -m http.server 8000
```

Then open http://localhost:8000.

## App files

- `index.html` — app entry point
- `noor-v5.css` and `noor-v5.js` — main app styling and behavior
- `noor-duas.css` and `noor-duas.js` — dua section styling and behavior

Some Quran data and audio features require an internet connection. The `noor/` directory preserves the earlier app source and Quran dataset tools.
