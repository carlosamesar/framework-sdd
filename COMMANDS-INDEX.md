# COMMANDS-INDEX.md

Indice corto de comandos `/gd:*` para no leer todos los markdown completos.

## Inicio y direccion

| Comando | Uso corto | Archivo |
|---|---|---|
| `/gd:start` | **orquestador principal** — detecta stack, complejidad y deriva al flujo SDD correcto | `.claude/commands/gd/start.md` |
| `/gd:rapido` | tareas pequenas y de baja complejidad (alias de start para nivel 0-1) | `.claude/commands/gd/rapido.md` |
| `/gd:completo` | flujos amplios o complejos (alias de start para nivel 3-4) | `.claude/commands/gd/completo.md` |
| `/gd:route` | decidir siguiente accion o flujo | `.claude/commands/gd/route.md` |
| `/gd:checkpoint` | snapshot por fase | `.claude/commands/gd/checkpoint.md` |
| `/gd:doom-shield` | salir de bloqueos o loops | `.claude/commands/gd/doom-shield.md` |

## Especificacion y analisis

| Comando | Uso corto | Archivo |
|---|---|---|
| `/gd:specify` | **nivel 2+** — escribir SPEC con criterios AC, contratos y reglas de negocio | `.claude/commands/gd/specify.md` |
| `/gd:clarify` | **nivel 2+** — resolver ambigüedades de la SPEC antes del plan técnico | `.claude/commands/gd/clarify.md` |
| `/gd:plan` | **nivel 2+** — plan técnico: patrón espejo, archivos, decisiones, orden de impl | `.claude/commands/gd/plan.md` |
| `/gd:breakdown` | **nivel 2+** — desglose en tareas atómicas TDD con criterios de done | `.claude/commands/gd/breakdown.md` |
| `/gd:razonar` | razonamiento profundo antes de actuar — modelos: primeros-principios, inversion, rlm-cadena-pensamiento, rlm-verificacion, mapa-territorio | `.claude/commands/gd/razonar.md` |
| `/gd:prd` | generar PRD desde fuentes | `.claude/commands/gd/prd.md` |
| `/gd:pseudocodigo` | bajar requerimientos a pseudocodigo | `.claude/commands/gd/pseudocodigo.md` |
| `/gd:validar-spec` | validar calidad de especificacion (alias: `/gd:validate-spec`) | `.claude/commands/gd/validar-spec.md` |
| `/gd:spec-score` | score cuantitativo de especificacion | `.claude/commands/gd/spec-score.md` |
| `/gd:reversa` | extraer arquitectura de un codebase existente | `.claude/commands/gd/reversa.md` |
| `/gd:research` | investigacion autonoma multi-step | `.claude/commands/gd/research.md` |
| `/gd:git-blame` | arqueologia Git por archivo:linea; devuelve commit, autor, fecha e issue keys | `.claude/commands/gd/git-blame.md` |
| `/gd:impact-predict` | predice tests afectados por archivos cambiados; skeleton heurístico previo a call graph AST | `.claude/commands/gd/impact-predict.md` |
| `/gd:sql` | traduccion/ejecucion SQL read-only con guardrails y LIMIT forzado | `.claude/commands/gd/sql.md` |
| `/gd:eval` | evaluar fases SDD | `.claude/commands/gd/eval.md` |

## Implementacion y control

| Comando | Uso corto | Archivo |
|---|---|---|
| `/gd:implement` | TDD: RED → GREEN → REFACTOR por tarea del breakdown | `.claude/commands/gd/implement.md` |
| `/gd:review` | orquestador central de calidad — 7 dimensiones, gate PASS/FAIL | `.claude/commands/gd/review.md` |
| `/gd:verify` | validar implementación contra SPEC y tasks (VERIFY PASS/FAIL) | `.claude/commands/gd/verify.md` |
| `/gd:close` | cerrar spec con evidencia, contrato y certificación total | `.claude/commands/gd/close.md` |
| `/gd:release` | gate de release estricto antes de despliegue | `.claude/commands/gd/release.md` |
| `/gd:deploy` | despliegue AWS con gates de cero errores | `.claude/commands/gd/deploy.md` |
| `/gd:archive` | sincronizar delta specs y archivar change completado | `.claude/commands/gd/archive.md` |
| `/gd:score` | maturity score del change (0-100%) — gate para archive | `.claude/commands/gd/score.md` |
| `/gd:flow` | pipeline declarativo multi-fase | `.claude/commands/gd/flow.md` |
| `/gd:policy` | reglas declarativas del agente | `.claude/commands/gd/policy.md` |
| `/gd:guardrail` | validacion I/O por fase | `.claude/commands/gd/guardrail.md` |
| `/gd:preflight` | estimar costo y tokens antes de ejecutar | `.claude/commands/gd/preflight.md` |
| `/gd:reflexionar` | capturar lecciones aprendidas | `.claude/commands/gd/reflexionar.md` |
| `/gd:time-travel` | revisar decisiones del framework | `.claude/commands/gd/time-travel.md` |

## Testing y validacion

| Comando | Uso corto | Archivo |
|---|---|---|
| `/gd:test-Backend` | TDD backend Lambda y NestJS | `.claude/commands/gd/test-Backend.md` |
| `/gd:test-Frontend` | TDD frontend con Playwright | `.claude/commands/gd/test-Frontend.md` |
| `/gd:playwright` | automatizacion E2E frontend | `.claude/commands/gd/playwright.md` |
| `/gd:tea` | generar, ejecutar y reportar tests | `.claude/commands/gd/tea.md` |
| `/gd:tech-debt` | detectar deuda tecnica | `.claude/commands/gd/tech-debt.md` |
| `/gd:auditar-lambdas` | auditar madurez de lambdas por dominio; inventario por defecto | `.claude/commands/gd/auditar-lambdas.md` |

## Utilidades

| Comando | Uso corto | Archivo |
|---|---|---|
| `/gd:frontend` | **estricto y homogeneo** con `/treasury/inflows/new` + `/purchases/orders/new`; sin desviaciones ad-hoc | `.claude/commands/gd/frontend.md` |
| `/gd:start-frontend` | **otros módulos / features nuevas** — Angular 19, Signals, Smart/Dumb, parqueaderos/ | `.claude/commands/gd/start-frontend.md` |
| `/gd:start-backend` | **Lambda / NestJS** — gooderp-orchestation, dominios, despliegue AWS, CORS, tenantId | `.claude/commands/gd/start-backend.md` |
| `/gd:presentar` | generar presentacion HTML | `.claude/commands/gd/presentar.md` |
| `/gd:webhook` | disparadores externos | `.claude/commands/gd/webhook.md` |
| `/gd:voice` | integracion con voz | `.claude/commands/gd/voice.md` |

## Regla

Leer el markdown completo de un comando solo si el usuario lo va a ejecutar o si la tarea depende de ese flujo especifico.

## Regla de Routing Frontend

```
¿La tarea involucra purchase-management/?
  SÍ → /gd:frontend  (BehaviorSubject, no Signals)
  NO → /gd:start-frontend  (Signals, patrón parqueaderos/)
```

NO mezclar los dos stacks.

## Skill asociado

- `gd-command-governance` → `.claude/skills/gd-command-governance/SKILL.md` (obligatorio para todos los `/gd:*`, anti-alucinacion, evidence-first, hard-fail)
- `gd-skill-routing` (archivo de mapeo) → `.claude/commands/gd/SKILL-ROUTING.md` (comando → skill especializado)
- `gd-frontend` → `.claude/skills/gd-frontend/SKILL.md`
- `gd-start-impact-report` → `.claude/skills/gd-start-impact-report/SKILL.md` (gate obligatorio en `/gd:start`, con plantillas frontend/backend/fullstack + rechazo automatico)
- `git-archaeology` → `.claude/skills/git-archaeology/SKILL.md`
- `impact-predictor` → `.claude/skills/impact-predictor/SKILL.md`
- `sql-readonly` → `.claude/skills/sql-readonly/SKILL.md`