# Create my AI Context

Chrome extension that turns natural-language notes or files into a **compact English AI context pack** — on-device with Gemini Nano (Prompt API). No upload to AI4Context servers.

**Store name:** Create my AI Context  
**Repo:** https://github.com/mapicallo/createMyAIcontext  
**Plan:** [docs/plan-implementacion.md](docs/plan-implementacion.md)

## Status

| Version | Scope |
|---------|--------|
| **0.4.0** | Full flows + UI EN/ES/PT/FR/DE + store polish |
| 0.5.x | Guided templates + LocalChat interop (optional) |

## Develop

```bash
cd apps/extension
npm install
npm run build
```

Load `apps/extension/dist` as an unpacked extension in `chrome://extensions`.

```bash
npm run pack   # ZIP for Chrome Web Store
```

## Requirements

- Chrome 138+ desktop with Gemini Nano / Prompt API available
- Windows / macOS / Linux (desktop Chrome)

## Privacy

All processing stays on your device. See `apps/extension/public/privacy.html`.
