# Chrome Web Store — Create my AI Context

## Listing (draft)

**Name:** Create my AI Context  

**Short description (≤132 chars):**  
Turn notes or files into a compact English AI context—merge packs, refine in plain language. On-device with Chrome AI.

**Detailed description (EN draft):**  
Create my AI Context turns long, messy notes into a compact English context pack you can reuse in ChatGPT, Claude, Gemini, Cursor, or any other AI chat.

How it works:
1. Paste text or upload TXT/MD/PDF.
2. Add a title, objective, and optional constraints.
3. Chrome’s on-device Gemini Nano compiles an efficient `.aicontext.json` pack plus a copy-paste prompt block.
4. Save packs to a local library for reuse.

Why:
- Spend fewer tokens on fluff.
- Keep a portable context across models and threads.
- Stay private — processing stays on your device.

Coming soon: interpret & refine in plain language, more UI languages.

Requires Chrome desktop with Gemini Nano / Prompt API available.

**Category:** Productivity  
**Language:** English (UI also Spanish)

## Package

```bash
cd apps/extension
npm install
npm run pack
```

Artifact: `apps/extension/releases/CreateMyAIContext-v{version}.zip`

## Single purpose

Create compact, reusable AI context packs on-device from user-provided text (and files in later versions).

## Permissions

- `storage` — UI locale and (later) local pack library.
