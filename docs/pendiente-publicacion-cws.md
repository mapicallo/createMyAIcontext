# Pendiente: publicación en Chrome Web Store

**Producto:** Create my AI Context  
**Estado (2026-07-28):** cupo CWS **desbloqueado** — listo para publicar (seguir checklist abajo).

---

## Cupo CWS

| Ítem | Detalle |
|------|---------|
| Cuenta CWS | `mapicalopez1971.apps` / email `mapicalloperez1971.apps@gmail.com` |
| Case ID | **7-9974000040937** |
| Solicitud | Enviada el **2026-07-26** vía One Stop Support |
| Resolución (2026-07-28) | **Aprobado:** *“An additional publishing limit of 20 has been granted to your account.”* → ~**40** ítems publicados permitidos en total |
| Acción | Ya se puede **añadir / publicar** un ítem nuevo en el Developer Dashboard |

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

## Checklist al publicar

1. [ ] Confirmar en el Developer Dashboard que se puede **añadir / publicar** un ítem nuevo.
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
