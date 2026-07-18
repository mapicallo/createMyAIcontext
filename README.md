# Create my AI Context

Chrome extension that turns natural-language notes or files into a **compact English AI context pack** — on-device with Gemini Nano (Prompt API). No upload to AI4Context servers.

**Store name:** Create my AI Context  
**Repo:** https://github.com/mapicallo/createMyAIcontext  
**Plan:** [docs/plan-implementacion.md](docs/plan-implementacion.md)

## Status

| Version | Scope |
|---------|--------|
| **0.2.0** | Compile text/file + merge packs + local library |
| 0.3.0 | Interpret & refine (planned) |
| 0.4.0 | More UI languages + landing (planned) |

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
