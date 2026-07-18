# Chrome Web Store — Create my AI Context

## Listing copy (EN)

**Name:** Create my AI Context  

**Short description (≤132 chars):**  
Turn notes or files into a compact English AI context—merge packs, refine in plain language. On-device with Chrome AI.

**Detailed description:**

Create my AI Context turns long, messy notes into a compact English context pack you can reuse in ChatGPT, Claude, Gemini, Cursor, or any other AI chat.

How it works:
1. Paste text or upload TXT / MD / PDF.
2. Add a title, objective, and optional constraints.
3. Chrome’s on-device Gemini Nano compiles an efficient `.aicontext.json` pack plus a copy-paste prompt block.
4. Save packs to a local library.
5. Merge 2–5 packs, or interpret a draft context in plain language and refine before building the pack.

Why:
- Spend fewer tokens on fluff.
- Keep a portable context across models and threads.
- Stay private — processing stays on your device.

Use cases (examples): contextual twin / identity pack, professional CV context, project brief, brand tone, family + work merged packs.

Requires Chrome desktop with Gemini Nano / Prompt API available.
UI languages: English, Spanish, Portuguese, French, German. Output packs are always English.

**Category:** Productivity  
**Language:** English (UI also ES / PT / FR / DE)

## Locale listing notes (optional CWS locales)

| Locale | Short description hint |
|--------|------------------------|
| es | Convierte notas o archivos en un contexto IA compacto en inglés—fusiona packs y ajústalos. En el dispositivo con Chrome AI. |
| pt-BR | Transforme notas ou arquivos em um contexto de IA compacto em inglês—mescle packs e refine. No dispositivo com Chrome AI. |
| fr | Transformez notes ou fichiers en un contexte IA compact en anglais—fusionnez et affinez. Sur l’appareil avec Chrome AI. |
| de | Notizen oder Dateien in kompakten englischen KI-Kontext verwandeln—Packs zusammenführen und verfeinern. On-Device mit Chrome AI. |

## Screenshots / promo

Generate placeholders:

```bash
cd apps/extension
node scripts/generate-store-assets.mjs
```

Replace `store-assets/*.png` with real UI captures before CWS submission (recommended 1280×800).

## Package

```bash
cd apps/extension
npm install
npm run pack
```

Artifact: `apps/extension/releases/CreateMyAIContext-v{version}.zip`

## Single purpose

Create compact, reusable AI context packs on-device from user-provided text/files, with merge and interpret/refine flows.

## Permissions

- `storage` — UI locale and local pack library.
