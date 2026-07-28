# Chrome Web Store — Create my AI Context

> **Estado (2026-07-28):** cupo CWS ampliado (+20). Paquete y pantallazos listos — **publicar ahora**.  
> Checklist completo → [`docs/pendiente-publicacion-cws.md`](../docs/pendiente-publicacion-cws.md)  
> ZIP: `releases/CreateMyAIContext-v0.4.5.zip` · Capturas: `C:\pantallazos\createMyAIContext\`

## Listing copy (EN)

**Name:** Create my AI Context  

**Short description (≤132 chars):**  
Turn notes or files into a compact AI context—merge, refine in plain language. On-device with Chrome AI.

**Detailed description:**

Create my AI Context turns long, messy notes into a compact, reusable AI context you can paste into ChatGPT, Claude, Gemini, Cursor, or any other AI chat.

How it works:
1. Paste text or upload TXT / MD / PDF / ODT / DOCX.
2. Add a title, objective, and optional constraints.
3. Chrome’s on-device Gemini Nano builds an efficient `.aicontext.json` file plus a copy-paste prompt block.
4. Save contexts to a local library.
5. Merge 2–5 contexts, or interpret a draft in plain language and refine before building the final context.

Why:
- Spend fewer tokens on fluff.
- Keep a portable context across models and threads.
- Stay private — processing stays on your device.

Note: the reusable context artifact is written in English for broad model compatibility and token efficiency. The extension UI (and interpret/refine answers) follow the language you choose in the panel (EN/ES/PT/FR/DE).

Use cases (examples): contextual twin / identity context, professional CV context, project brief, brand tone, family + work merged contexts.

Requires Chrome desktop with Gemini Nano / Prompt API available.
UI languages: English, Spanish, Portuguese, French, German.

**Category:** Productivity  
**Language:** English (UI also ES / PT / FR / DE)

## Locale listing notes (optional CWS locales)

| Locale | Short description hint |
|--------|------------------------|
| es | Convierte notas o archivos en un contexto de IA compacto—fusiona y ajusta. En el dispositivo con Chrome AI. |
| pt-BR | Transforme notas ou arquivos em um contexto de IA compacto—mescle e refine. No dispositivo com Chrome AI. |
| fr | Transformez notes ou fichiers en un contexte IA compact—fusionnez et affinez. Sur l’appareil avec Chrome AI. |
| de | Notizen oder Dateien in kompakten KI-Kontext verwandeln—zusammenführen und verfeinern. On-Device mit Chrome AI. |

## Screenshots / promo

**Capturas reales (usar estas al publicar):**  
`C:\pantallazos\createMyAIContext\`  
(`1_createMyAIContext.png` … `4_createMyAIContext.png`)

Placeholders opcionales:

```bash
cd apps/extension
node scripts/generate-store-assets.mjs
```

Recommended size: 1280×800.

## Package

```bash
cd apps/extension
npm install
npm run pack
```

Artifact: `apps/extension/releases/CreateMyAIContext-v{version}.zip`  
Current ready package: **`CreateMyAIContext-v0.4.5.zip`**

## Single purpose

Create compact, reusable AI contexts on-device from user-provided text/files, with merge and interpret/refine flows.

## Permissions

- `storage` — UI locale and local context library.
