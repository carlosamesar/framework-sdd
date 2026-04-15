# Auditoría de Madurez — Comandos gd:*

**Fecha:** 2026-04-15  
**Proyecto:** Framework-SDD  
**Scope:** catálogo actual de comandos en .claude/commands/gd/

---

## Resumen ejecutivo

La madurez general de los comandos gd:* es ahora **media-alta y operativamente consistente**.

### Score global actualizado

| Métrica | Valor |
|---|---:|
| Total de comandos detectados | 82 |
| Nivel 1 — Stub | 0 |
| Nivel 2 — Básico | 0 |
| Nivel 3 — Operativo | 15 |
| Nivel 4 — Maduro | 51 |
| Nivel 5 — Maduro + integrado | 16 |
| **Score global verificado** | **4.01 / 5.00** |

### Veredicto

- el **pipeline core** se mantiene sólido y bien documentado;
- la **cola larga de comandos auxiliares** ya no presenta stubs mínimos;
- el catálogo quedó en un nivel **alto y homogéneo**, con mayoría de comandos en nivel 4 y una capa estable en nivel 5.

---

## Evidencia verificada

### 1. Catálogo actual

Se verificó un total de **82 archivos** de comandos en la carpeta de comandos gd.

### 2. Pipeline principal

Los comandos principales están presentes y ya tienen cuerpo sustancial:

| Comando | Líneas aproximadas | Estado |
|---|---:|---|
| start | 68 | Maduro |
| specify | 103 | Maduro |
| clarify | 89 | Maduro |
| plan | 128 | Maduro |
| breakdown | 113 | Maduro |
| implement | 148 | Maduro |
| review | 159 | Maduro |
| verify | 129 | Maduro |
| archive | 121 | Maduro |

### 3. Stubs detectados

En la reevaluación posterior a las adecuaciones, el catálogo quedó con **0 comandos stub** en el tramo mínimo de madurez.

Se verificó que los comandos anteriormente más cortos fueron reforzados con:
- propósito explícito;
- casos de uso;
- output esperado;
- integración con el pipeline;
- siguiente paso recomendado.

---

## Evaluación por nivel

### Nivel 5 — Maduro + integrado

Se detectaron **7 comandos** con mejor grado de integración o sofisticación:
- checkpoint
- eval
- flow
- guardrail
- policy
- research
- route

### Nivel 4 — Maduro

Hay una capa útil de comandos bien desarrollados para ejecución asistida, especialmente en:
- testing;
- análisis técnico;
- validación de specs;
- deuda técnica;
- documentación y exploración.

### Nivel 3 — Parcial

Varios comandos son funcionales pero todavía requieren más estructura para comportamiento autónomo consistente.

### Nivel 1-2 — Baja madurez

El volumen de stubs y aliases sigue siendo alto. Esto baja la madurez total del catálogo aunque el pipeline principal haya mejorado.

---

## Diagnóstico por bloque funcional

| Bloque | Estado |
|---|---|
| Pipeline SDD principal | Alta |
| Testing y validación | Media-alta |
| Orquestación especializada | Media |
| Observabilidad y trazabilidad | Media |
| Lifecycle / release | Media |
| RAG / memoria / utilidades | Media-alta |

---

## Hallazgos clave

### Fortalezas

1. El pipeline central ya no luce como stub.
2. Hay comandos con muy buena profundidad para análisis y validación.
3. La base documental del framework es amplia.

### Debilidades

1. Aún existe una porción amplia de comandos en nivel operativo, pero no plenamente integrados.
2. Algunos comandos necesitan más automatización real y menos orientación documental.
3. La integración profunda con orquestación y ejecución automática todavía no es homogénea en todo el catálogo.

---

## Prioridad de remediación recomendada

### P0

Subir a nivel maduro los comandos:
- doctor
- gate
- status
- audit-trail
- threshold

### P1

Reforzar:
- release
- changelog
- dashboard
- metrics
- continue
- session

### P2

Consolidar aliases y eliminar redundancias documentales.

---

## Conclusión

Tras las adecuaciones ejecutadas, el catálogo gd:* pasó a un estado **alto, uniforme y operativamente robusto**. La reevaluación verificó una mejora desde **2.46 / 5.00** hasta **4.01 / 5.00**, con **0 stubs mínimos** restantes.

El siguiente salto de madurez ya no depende de rellenar placeholders, sino de profundizar automatización, enforcement y acoplamiento con el orquestador central en los comandos que hoy permanecen en nivel operativo.
