# Salidas JSON para orquestación ReAct

Esquemas (`*.schema.json`) para que el modelo (o un supervisor) valide **observaciones** entre pasos del pipeline SDD.

| Fase | Esquema |
|------|---------|
| `/gd:specify` | `specify.output.schema.json` |
| `/gd:plan` | `plan.output.schema.json` |
| `/gd:breakdown` | `breakdown.output.schema.json` |
| `/gd:verify` | `verify.output.schema.json` (complementario a `reports/verify-<slug>.json`) |

No sustituyen los Markdown en `openspec/changes/`; son contrato opcional Thought → Action → Observation.

## Ejemplos y CI

- Carpeta [`examples/`](./examples/): un `*.example.json` por cada `*.schema.json`.
- Validación: `npm run spec:validate-react` (Ajv 2020-12, parte de `npm run framework:ci`).
