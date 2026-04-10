# Exploration: Migración de id_estado a UUID

### Current State
La tabla `public.estados` (identificada como la tabla `estado` referida por el usuario) utiliza una columna `id_estado` de tipo `integer` con una secuencia `serial`. Esta columna es referenciada por al menos 27 tablas en el esquema `public` como llave foránea.

### Affected Areas
- `public.estados` — Cambio de PK de `integer` a `uuid`.
- `public.actividades_economicas`, `public.bancos`, `public.bodegas`, etc. (27 tablas) — Cambio de FK de `integer` a `uuid`.
- Vistas, triggers o procedimientos que dependan de la relación entera.

### Approaches
1. **Migración en el sitio (Recomendada)** — Alterar las columnas existentes.
   - Pros: Mantiene la estructura actual, menos disruptivo para el código que ya espera esas tablas.
   - Cons: Requiere desactivar FKs temporalmente, riesgo de downtime si no se hace en transacción.
   - Effort: Medium/High (por la cantidad de referencias).

2. **Nueva tabla y switch** — Crear `public.estados_new` y migrar datos.
   - Pros: Más seguro, permite validación antes del switch.
   - Cons: Requiere renombrar tablas y recrear todas las FKs de las 27 tablas dependientes.
   - Effort: High.

### Recommendation
Usar un script de migración SQL que:
1. Cree una columna temporal `id_uuid` en `public.estados`.
2. Genere UUIDs para cada estado.
3. Actualice las 27 tablas dependientes mapeando el `integer` actual al nuevo `UUID`.
4. Elimine las FKs antiguas.
5. Convierta `id_uuid` en la nueva PK.
6. Reestablezca las FKs como `UUID`.

### Risks
- **Inconsistencia de datos**: Si una tabla dependiente no se actualiza correctamente.
- **Breaking changes en código**: Aplicaciones que esperen explícitamente un entero para `id_estado`.
- **Performance**: Bloqueo de tablas durante la migración masiva.

### Ready for Proposal
Yes.
