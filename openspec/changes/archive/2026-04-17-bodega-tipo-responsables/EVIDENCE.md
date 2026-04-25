# Certificación Funcional — bodega-tipo-responsables

**Fecha:** 2026-04-17  
**Ejecutado por:** OpenCode (CTO Grupo 4D)  
**Entorno:** AWS Lambda `fnBodega` (us-east-1) — invocación directa  
**DB:** DigitalOcean PostgreSQL `gooderp-dev`  
**Resultado:** ✅ 18/18 pruebas pasadas

---

## Resumen

| Categoría | Tests | Resultado |
|-----------|-------|-----------|
| GET /bodegas | 4 | ✅ |
| POST — happy path | 3 | ✅ |
| POST — validaciones | 3 | ✅ |
| PUT — update campos | 2 | ✅ |
| GET by ID — persistencia | 2 | ✅ |
| **Total** | **18** | **✅ 18/18** |

---

## Evidencia por escenario

### T1 — GET /bodegas (lista con nuevos campos)

- **Status:** `200 OK`
- **Assertion:** La respuesta contiene lista de bodegas
- **Assertion:** Cada bodega incluye campo `tipo_bodega`
- **Assertion:** Cada bodega incluye campo `responsables`
- **Campos confirmados en respuesta:**
  ```
  id_bodega, id_tenant, id_sede, codigo, nombre, descripcion,
  capacidad_m3, responsable, telefono, creado_por, actualizado_por,
  fecha_creacion, fecha_actualizacion, tipo_bodega, responsables, sede
  ```
- ✅ PASS

---

### T2 — POST con tipo_bodega=Fisica + responsables válidos

- **Input:**
  ```json
  {
    "codigo": "BT-FIS-463522",
    "nombre": "BodTest-Fisica-1776463522",
    "ubicacion": "Test Location Fisica",
    "tipo_bodega": "Fisica",
    "responsables": [{"id_usuario": "a4b8d478-60b1-70dc-4d9c-65c75aa45c0c", "es_principal": true}]
  }
  ```
- **Status:** `201 Created`
- **id_bodega creado:** `469eb195-3688-416c-b9b0-ff0266ac4eee`
- **Assertions:**
  - `tipo_bodega == "Fisica"` ✅
  - `responsables` presente y con 1 elemento ✅
- ✅ PASS

---

### T3 — POST con tipo_bodega=Virtual (sin responsables)

- **Input:**
  ```json
  {
    "codigo": "BT-VRT-463522",
    "nombre": "BodTest-Virtual-1776463522",
    "ubicacion": "Test Location Virtual",
    "tipo_bodega": "Virtual"
  }
  ```
- **Status:** `201 Created`
- **id_bodega creado:** `022cd768-f19b-4cf2-8b85-30a60af82913`
- **Assertion:** `tipo_bodega == "Virtual"` ✅
- ✅ PASS

---

### T4 — POST sin tipo_bodega (campo opcional)

- **Input:**
  ```json
  {
    "codigo": "BT-NT-463522",
    "nombre": "BodTest-NoTipo-1776463522",
    "ubicacion": "Test Location NoTipo"
  }
  ```
- **Status:** `201 Created`
- **id_bodega creado:** `9a5739a9-930a-47c7-a633-a3a0d9e42899`
- **Assertion:** Creación exitosa sin campo tipo_bodega ✅
- ✅ PASS

---

### T5 — POST con tipo_bodega inválido → 400

- **Input:** `"tipo_bodega": "INVALIDO"`
- **Status:** `400 Bad Request`
- **Error:** `"tipo_bodega must be one of: Virtual, Fisica"`
- ✅ PASS

---

### T6 — POST con responsables sin es_principal=true → 400

- **Input:** `responsables: [{"id_usuario": "...", "es_principal": false}]`
- **Status:** `400 Bad Request`
- **Error:** `"responsables must have exactly one principal"`
- ✅ PASS

---

### T7 — POST con múltiples es_principal=true → 400

- **Input:** 2 responsables ambos con `es_principal: true`
- **Status:** `400 Bad Request`
- **Error:** `"responsables must have exactly one principal"`
- ✅ PASS

---

### T8 — PUT actualizar tipo_bodega + responsables

- **Bodega:** `469eb195-3688-416c-b9b0-ff0266ac4eee` (creada en T2 con tipo `Fisica`)
- **Input:**
  ```json
  {
    "tipo_bodega": "Virtual",
    "responsables": [{"id_usuario": "a4b8d478-60b1-70dc-4d9c-65c75aa45c0c", "es_principal": true}]
  }
  ```
- **Status:** `200 OK`
- **Assertion:** `tipo_bodega == "Virtual"` ✅
- ✅ PASS

---

### T9 — GET by ID verificar persistencia

- **Bodega:** `469eb195-3688-416c-b9b0-ff0266ac4eee`
- **Status:** `200 OK`
- **Assertions:**
  - `tipo_bodega == "Virtual"` (actualizado en T8) ✅
  - `responsables` es array ✅
- ✅ PASS

---

## Infraestructura

| Componente | Detalle |
|-----------|---------|
| Lambda | `fnBodega` — CodeSize: 17,242,701 bytes — LastModified: `2026-04-17T21:52:11Z` |
| DB Migration | `sql/add-bodega-tipo-responsables.sql` — ejecutada en `gooderp-dev` |
| ENUM creado | `tipo_bodega_enum ('Virtual', 'Fisica')` |
| Columnas DB | `public.bodegas.tipo_bodega`, `public.bodegas.responsables (JSONB)` |
| Región | `us-east-1` |

---

## IDs creados durante certificación

| Test | id_bodega | tipo_bodega |
|------|-----------|-------------|
| T2 | `469eb195-3688-416c-b9b0-ff0266ac4eee` | Fisica → Virtual (actualizado T8) |
| T3 | `022cd768-f19b-4cf2-8b85-30a60af82913` | Virtual |
| T4 | `9a5739a9-930a-47c7-a633-a3a0d9e42899` | null (sin tipo) |

---

**Certificación completada:** 2026-04-17T22:05:29Z  
**Estado:** ✅ APROBADO — listo para archive
