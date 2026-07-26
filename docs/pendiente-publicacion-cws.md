# Pendiente: publicación en Chrome Web Store

**Producto:** Create my AI Context  
**Estado (2026-07-26):** listo para publicar — **bloqueado por el límite de 20 extensiones** de la cuenta de desarrollador.  
**Cuando Google apruebe el aumento de cupo → retomar este checklist.**

---

## Bloqueo actual

| Ítem | Detalle |
|------|---------|
| Cuenta CWS | `mapicalopez1971.apps` / email `mapicalloperez1971.apps@gmail.com` |
| Límite | 20 extensiones publicadas (cupo por defecto) |
| Solicitud | Enviada el **2026-07-26** vía [One Stop Support](https://support.google.com/chrome_webstore/contact/one_stop_support) → *Mi cuenta de desarrollador* → *Tengo otros problemas con mi cuenta* |
| Qué pedir | Aumento del *published item limit* / cuota de ítems publicados |
| Respuesta | Revisar el correo de la cuenta de desarrollador (confirmación + posibles preguntas de Google) |

**Alternativa si el aumento tarda:** despublicar temporalmente alguna extensión poco usada para liberar 1 hueco y publicar esta.

---

## Paquete listo (ZIP)

Versión empaquetada: **v0.4.5**

| Ubicación | Archivo |
|-----------|---------|
| Principal | `C:\code_createMyAIcontext\apps\extension\CreateMyAIContext-v0.4.5.zip` |
| Copia releases | `C:\code_createMyAIcontext\apps\extension\releases\CreateMyAIContext-v0.4.5.zip` |

Regenerar (si hay cambios de código antes de publicar):

```bash
cd C:\code_createMyAIcontext\apps\extension
npm run pack
```

El nombre del ZIP incluye la versión: `CreateMyAIContext-v{version}.zip`.

---

## Pantallazos preparados

Carpeta del usuario (fuera del repo):

`C:\pantallazos\createMyAIContext\`

| Archivo | Uso sugerido en CWS |
|---------|---------------------|
| `1_createMyAIContext.png` | Captura 1 (orden de listado) |
| `2_createMyAIContext.png` | Captura 2 |
| `3_createMyAIContext.png` | Captura 3 |
| `4_createMyAIContext.png` | Captura 4 |

Recomendado CWS: **1280×800** (o el ratio que acepte el dashboard). Si hace falta redimensionar, hacerlo antes de subir.

También hay placeholders en `apps/extension/store-assets/` (generados por script); **usar las capturas reales** de la carpeta anterior.

---

## Checklist al autorizar el cupo

1. [ ] Confirmar en el Developer Dashboard que se puede **añadir / publicar** un ítem nuevo (o que el cupo ha subido).
2. [ ] Si el código avanzó desde v0.4.5: `npm run pack` y usar el ZIP nuevo con la versión actualizada.
3. [ ] **Nuevo ítem** → subir `CreateMyAIContext-v0.4.5.zip` (o el ZIP regenerado).
4. [ ] Completar ficha (ver `apps/extension/CHROME_WEB_STORE.md`):
   - Nombre: **Create my AI Context**
   - Categoría: Productivity
   - Short + detailed description (EN; locales ES/PT/FR/DE opcionales)
   - Privacy / single purpose / permisos (`storage`)
5. [ ] Subir las 4 capturas desde `C:\pantallazos\createMyAIContext\`.
6. [ ] Privacy policy URL: página embebida `privacy.html` de la extensión (o URL pública si ya hay una en ai4context.com).
7. [ ] Enviar a revisión.
8. [ ] Tras aprobación: anotar el ID CWS y, si aplica, actualizar landing AI4Context + `storeUrls`.

---

## Contenido relevante de v0.4.5 (recordatorio)

- Cabecera / footer familia AI4Context (como AccessPortal / LocalChat).
- Sin banner “Chrome AI listo” cuando el modelo está disponible.
- Terminología UI: **contexto / contexto de IA** (no “pack”).
- Artefacto interno `.aicontext.json` / prompt en **inglés**; nota explicativa en UI si el idioma de interfaz ≠ EN.
- Interpretar / ajustar: respuesta al usuario en el idioma del selector.
- Flujos: desde texto, desde archivo (TXT/MD/PDF/ODT/DOCX), fusionar, interpretar y ajustar, biblioteca local.

---

## Docs relacionados

- Plan de producto/fases: `docs/plan-implementacion.md`
- Copy y notas de tienda: `apps/extension/CHROME_WEB_STORE.md`
- Workspace: `C:\code_createMyAIcontext\`
- Repo: https://github.com/mapicallo/createMyAIcontext
