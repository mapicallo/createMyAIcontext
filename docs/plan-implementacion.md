# Create my AI Context — Plan de implementación

**Fecha:** julio 2026  
**Producto:** **Create my AI Context**  
**Repo:** [createMyAIcontext](https://github.com/mapicallo/createMyAIcontext)  
**Workspace local:** `C:\code_createMyAIcontext\`  
**Plataforma:** extensión Chrome MV3 — **Gemini Nano (Prompt API) on-device**  
**Referencia de arquitectura:** LocalChat (`C:\code-localChat`) — panel, i18n, packing CWS, privacidad  

---

## 1. Objetivo

Convertir contexto en lenguaje natural (con “paja”, en el idioma del usuario) en un **artefacto de contexto eficiente en inglés**, portable entre modelos e hilos, **sin subir datos a servidores propios**.

| Problema | Cómo lo aborda el producto |
|----------|----------------------------|
| Tokens/créditos mal gastados | Compactar señal, quitar ruido, salida en **inglés** (idioma de trabajo interno transparente) |
| La calidad de la respuesta depende del contexto | Guiar campos (título, objetivo…) + ciclo interpretar ↔ ajustar |
| Repegar el mismo contexto en cada IA/chat | Fichero portable reutilizable (export/import) |
| Unir varios “yo” / ámbitos | Merge de artefactos ya optimizados |

**Nombre CWS (propuesto)**  
`Create my AI Context`

**Short description (borrador, ≤132 chars)**  
`Turn notes or files into a compact English AI context—merge packs, refine in plain language. On-device with Chrome AI.`

**Casos de uso en ficha web (no son el nombre del producto)**  
Gemelo / identidad contextual, CV profesional, contexto familiar, briefing de proyecto, tono de marca, etc. El usuario descubrirá más.

---

## 2. Principios de producto

1. **Artefacto primero** — el valor es el fichero de contexto, no el chat infinito.  
2. **Inglés de salida, UI local** — el usuario escribe/lee en su idioma; el pack exportado es EN.  
3. **On-device** — Prompt API / Gemini Nano; sin backend AI4Context para el núcleo.  
4. **Cuatro verbos claros** — Compilar (archivo) · Compilar (texto) · Fusionar · Interpretar/ajustar.  
5. **Honestidad** — Nano tiene límites; avisar truncados, fallos de modelo y “mejor resultado con Chrome 138+ / modelo disponible”.  
6. **Patrón Find my Phone** — nombre buscable, UI simple, un trabajo por pantalla.

---

## 3. Alcance por fases

### Fase 0 — Bootstrap del repo (v0.0.x interno)

| Entrega | Detalle |
|---------|---------|
| Git | `git init`, remote `origin` → `https://github.com/mapicallo/createMyAIcontext.git`, rama `main` |
| Stack | Extensión MV3 + Vite/TypeScript (mismo enfoque que LocalChat: `apps/extension`) |
| Scaffold | `manifest.json`, panel HTML/CSS/TS, service worker mínimo, iconos placeholder |
| Scripts | `dev`, `build`, `pack` (ZIP para CWS), `copy` assets |
| Docs base | `README.md`, `CHROME_WEB_STORE.md`, `privacy.html` (EN; ES en i18n de tienda luego) |
| Legal/privacidad | Texto: procesamiento local, sin upload de contexto a AI4Context |

**Permisos MVP (propuestos)**  
`storage` (+ lo mínimo para ficheros locales vía `<input type="file">` / File API — **sin** `activeTab`/`tabs` si no se lee la página).  
Revisar si hace falta `unlimitedStorage` solo si IndexedDB crece (Fase 3+).

---

### Fase 1 — MVP “Compile” (v0.1.0) — **primera publicación CWS**

**Incluido**

- UI panel: home con 2 entradas → **From file** / **From text**.  
- Campos de mejora (siempre, ambos flujos):
  - Título del contexto  
  - Objetivo del contexto (para qué se usará)  
  - Notas / restricciones opcionales (“no inventes…”, “tono formal…”)  
  - Idioma de la UI (independiente del EN de salida)  
- Entrada archivo: `.txt`, `.md`, `.pdf` (Word `.docx` en Fase 1b si el peso lo permite; si no, post-MVP).  
- Pipeline local:
  1. Extraer texto  
  2. (Opcional) chunk + resumen MapReduce si el texto supera umbral Nano  
  3. Prompt de **compilación** → artefacto estructurado EN  
  4. Validar / reparar JSON ligero  
  5. Exportar fichero descargable  
- Formato de salida: ver §4 (`*.aicontext.json` + vista “prompt block” copiable).  
- i18n UI: **ES, EN** (PT/FR/DE en Fase 4).  
- Detección disponibilidad Gemini Nano + mensajes de setup.  
- Historial local mínimo: últimos N packs (metadatos + cuerpo) en `chrome.storage.local` / IndexedDB.

**Excluido en v0.1.0**

| Ítem | Fase |
|------|------|
| Merge de packs | 2 |
| Interpretar ↔ diálogo de ajuste | 3 |
| `.docx` (si no cabe en 1) | 1b o 2 |
| Temas / sync nube | Fuera |
| Leer pestaña activa como fuente | Post-MVP (opcional) |
| Integración directa LocalChat | Post-MVP (export compatible) |

**Criterio de “done” v0.1.0**  
Usuario sube un PDF o pega texto → obtiene JSON + bloque prompt EN → puede copiar/pegar en ChatGPT/Claude/Cursor y el resultado es usable.

---

### Fase 2 — Merge (v0.2.0)

- Seleccionar 2–N packs ya creados por la herramienta (o importar `.aicontext.json`).  
- Campos: título del pack fusionado + objetivo del merge (“unificar CV + familia para…”) + prioridad/conflicto (“si chocan, prioriza trabajo”).  
- Pipeline: fusionar estructuras + regenerar sección narrativa EN densa.  
- Detectar solapes / contradicciones (aviso en UI, no bloqueo duro).  
- Límite MVP: máx. **5** packs por merge; tamaño total acotado.

---

### Fase 3 — Interpret & refine (v0.3.0)

Flujo inverso + diálogo:

1. Usuario pega o importa un “supuesto contexto” (texto o pack).  
2. Nano genera **interpretación en el idioma de la UI**: “Esto es lo que una IA entendería…”.  
3. Usuario pide cambios en lenguaje natural (“quita lo familiar”, “añade que soy autónomo”).  
4. La herramienta aplica y vuelve a emitir pack eficiente EN.  
5. Historial de turnos del refinamiento (solo local).

Este es el diferencial frente a un “summarize + translate” genérico.

---

### Fase 4 — i18n amplio + polish tienda (v0.4.0)

- UI: **ES, EN, PT (BR), FR, DE**.  
- Capturas CWS, promo tiles, textos listing EN (y locale packs si aplica).  
- Landing en `code-rag-java` / ai4context.com (ficha producto + casos de uso).  
- Ajustes UX: progreso en compilaciones largas, cancelar, reintentar.

---

### Fase 5 — Interop & casos de uso (v0.5.x, opcional)

- Plantillas guiadas (“Contextual twin / Identity”, “Professional CV”, “Project brief”) = presets de campos, no producto aparte.  
- Export “LocalChat work topic” / import desde LocalChat (si hay schema estable).  
- Atajo “Copy as system prompt” / “Copy as first message”.

---

## 4. Formato del artefacto (contrato)

**Nombre de fichero (propuesto)**  
`{slug-title}.aicontext.json`

**Schema MVP (v1)**

```json
{
  "format": "aicontext",
  "version": 1,
  "meta": {
    "title": "Professional CV — Mapicallo",
    "objective": "Use as standing context for career advice and cover letters",
    "createdAt": "2026-07-18T00:00:00.000Z",
    "sourceLang": "es",
    "outputLang": "en",
    "app": "Create my AI Context",
    "appVersion": "0.1.0"
  },
  "constraints": [
    "Do not invent employers or dates",
    "Prefer concise bullet facts"
  ],
  "facts": [
    { "key": "role", "value": "Software engineer", "weight": "high" },
    { "key": "stack", "value": "TypeScript, Chrome extensions", "weight": "high" }
  ],
  "narrative": "Dense English paragraph(s) optimized for LLM system/context injection…",
  "promptBlock": "=== AI CONTEXT PACK ===\nTitle: …\nObjective: …\n…",
  "stats": {
    "inputCharsApprox": 12000,
    "outputChars": 1800,
    "reductionRatioApprox": 0.15
  }
}
```

**Reglas de compilación (prompt de sistema interno)**

- Preferir **hechos tipados** + **narrative** corta; evitar prosa ornamental.  
- Todo valor exportado en **inglés**.  
- Conservar restricciones del usuario.  
- Si falta info crítica para el `objective`, listar `missingQuestions[]` (opcional en UI: “¿Quieres responder estas 3 preguntas?”) — puede ser Fase 1.1.

**Compatibilidad**  
Import solo de `format: "aicontext"` + `version` conocida; texto libre se trata como “supuesto contexto” (Fase 3) o fuente cruda (Fase 1).

---

## 5. Arquitectura técnica

```
apps/extension/
  public/
    manifest.json
    icons/
    privacy.html
  src/
    background/
    panel/          # UI principal (popup o side panel)
    lib/
      model.ts           # Prompt API / Gemini Nano
      extract/           # pdf, text (, docx)
      compile.ts         # NL → aicontext
      merge.ts           # packs → pack
      interpret.ts       # pack/texto → NL UI lang
      refine.ts          # diálogo de ajuste
      schema.ts          # tipos + validación
      exportImport.ts
      storage.ts         # historial local
      i18n/
    styles/
  scripts/
    build, pack-zip, …
```

| Pieza | Enfoque |
|-------|---------|
| UI | Panel único (side panel preferible si UX larga; popup OK en MVP) |
| IA | Chrome Prompt API; streaming opcional en Interpret |
| PDF | pdf.js (reutilizar patrón LocalChat) |
| Persistencia | `chrome.storage.local` metadatos; IndexedDB cuerpos si > cuota |
| Tests | Unitarios schema + repair JSON; smoke manual en Chrome canary/stable |

**Reutilización desde LocalChat (copiar/adaptar, no monorepo obligado)**  
Detección de modelo, i18n skeleton, packing ZIP, mensajes de “modelo no disponible”, extracción PDF, repair JSON ligero, presupuesto de contexto / summarize MapReduce para entradas largas.

---

## 6. UX (pantallas MVP)

1. **Home** — Create from file · Create from text · (luego) Merge · Interpret  
2. **Formulario compile** — campos + dropzone / textarea  
3. **Procesando** — estado + cancelar  
4. **Resultado** — stats de reducción, tabs: Prompt block | JSON | Facts  
5. **Acciones** — Copy prompt · Download `.aicontext.json` · Save to library · New  

Fase 3 añade: **Interpretation** (prosa) → chat corto de ajuste → Resultado.

---

## 7. Límites MVP (ajustables)

| Límite | Valor propuesto |
|--------|-----------------|
| Tamaño texto extraído | 400–500k chars (truncar con aviso) |
| Packs en biblioteca local | 30 |
| Packs por merge | 5 |
| Idiomas UI v0.1 | ES, EN |
| Word `.docx` | Fase 1b si no bloquea v0.1 |

---

## 8. Privacidad y tienda

- Política: contexto y packs **solo en el dispositivo**; no analytics de contenido.  
- Sin lectura de pestañas en MVP.  
- CWS: single purpose (“Create compact AI context packs on-device”).  
- Capturas: flujo file → result; flujo text → result; (v0.2) merge; (v0.3) interpret.  

---

## 9. Roadmap de versiones

| Versión | Contenido | Publicación |
|---------|-----------|-------------|
| 0.0.1 | Bootstrap + UI vacía | Solo repo |
| **0.1.0** | Compile file + text + export | **CWS review** |
| 0.1.1 | Hardening, docx si falta, missingQuestions | Parche |
| **0.2.0** | Merge | CWS |
| **0.3.0** | Interpret & refine | CWS |
| **0.4.0** | PT/FR/DE + landing | CWS + web |
| 0.5.x | Plantillas casos de uso + interop LocalChat | Opcional |

---

## 10. Orden de trabajo inmediato (checklist)

### Ahora (setup)

- [x] `git init` en `C:\code_createMyAIcontext`  
- [x] Commit inicial con este plan + README stub  
- [x] `git remote add origin https://github.com/mapicallo/createMyAIcontext.git`  
- [x] Push `main` (`11151d0` — v0.0.1)  
- [ ] Abrir el folder como workspace Cursor  

### Sprint A — Fase 0 + esqueleto Fase 1

- [x] Scaffold extensión TS + Vite  
- [x] Manifest, iconos, panel home  
- [x] `model.ts` + capability check  
- [x] Schema `aicontext` v1 + export download  
- [x] Compile from text (sin PDF aún) end-to-end  

### Sprint B — Completar v0.1.0

- [x] PDF extract (+ TXT/MD)  
- [x] Campos título/objetivo/restricciones  
- [x] Biblioteca local mínima  
- [x] i18n ES/EN  
- [x] privacy + CHROME_WEB_STORE.md + pack ZIP  
- [ ] Envío CWS  

### Después

- [x] Fase 2 Merge  
- [x] Fase 3 Interpret & refine  
- [ ] Fase 4 i18n/landing  

---

## 11. Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Nano débil en JSON largo | Schema simple + repair; narrative corta; facts tipados |
| Entradas enormes | Chunk + summarize antes de compile (patrón LocalChat Fase 11) |
| “Inglés siempre mejor” no es dogma | Mantener EN por defecto; opción avanzada “output lang” post-MVP si hace falta |
| Nombre genérico en CWS | Short + detailed description con keywords; capturas claras |
| Confusión con LocalChat | Mensaje: esta app **produce** contexto; LocalChat **consume** chat |

---

## 12. Decisiones abiertas (cerrar antes/durante Sprint A)

1. **Side panel vs popup** — recomendación: **side panel** (formularios + resultado largos).  
2. **¿Incluir `.docx` en 0.1.0?** — recomendación: **no** si atrasa el primer envío; TXT/MD/PDF basta.  
3. **¿Preguntas de huecos (`missingQuestions`) en 0.1.0?** — recomendación: **sí, ligero** (lista opcional en resultado).  
4. **¿Librería de packs en IndexedDB desde el día 1?** — recomendación: **sí mínima** (necesario para Merge en 0.2).  

---

## 13. Relación con el ecosistema AI4Context

```
[Notas / PDF / texto]
        ↓
 Create my AI Context  →  .aicontext.json / promptBlock (EN)
        ↓
  ChatGPT · Claude · Gemini · Cursor · LocalChat · AccessPortal …
```

Landing: ficha propia + mención cruzada con LocalChat (“pega el pack como contexto / tema”).

---

**Siguiente acción sugerida:** confirmar decisiones §12 y arrancar **Fase 0** (init git + scaffold) en `C:\code_createMyAIcontext`.
