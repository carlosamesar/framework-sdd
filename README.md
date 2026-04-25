# Framework-SDD

Framework-SDD es un framework de trabajo para desarrollo guiado por especificacion, ejecucion disciplinada del ciclo de vida `/gd:*`, captura de evidencias, auditoria trazable y consulta RAG local sobre el conocimiento del proyecto.

Este repositorio hoy contiene dos capas que conviven:

- El framework operativo de SDD, evidencias y reglas de trabajo.
- Artefactos reales del proyecto `sigat-client`, incluyendo scripts de certificacion, pruebas operativas, respuestas API y evidencia de despliegue.

## Estado actual

- Estado general: operativo.
- Persistencia de evidencias: SQLite local en `.data/framework-sdd-audit.db`.
- Captura de evidencias: funcional.
- Vectorizacion local: funcional.
- Scoring de madurez: funcional.
- Certificacion del flujo de evidencia: `100%`, nivel `5/5`, ya validada de extremo a extremo.
- Ultimo snapshot publicado: commit `f011761` en `origin/master`.

## Que resuelve

Framework-SDD busca que el desarrollo no dependa de memoria informal ni de validaciones manuales sueltas. El objetivo es que cada cambio pase por un flujo verificable, con evidencia suficiente para responder estas preguntas:

- Que se cambio.
- Por que se cambio.
- Que pruebas corrieron.
- Quien aprobo.
- Si la verificacion paso.
- Si hubo despliegue exitoso.
- Que evidencia existe para auditoria o analisis posterior.

## Capacidades principales

### 1. Flujo SDD disciplinado

El framework esta pensado para operar alrededor de comandos `/gd:*` y una secuencia de trabajo tipo:

1. Definir o iniciar cambio.
2. Implementar con TDD.
3. Ejecutar pruebas bloqueantes.
4. Revisar.
5. Verificar.
6. Cerrar, liberar o archivar.

### 2. Sistema de evidencias centralizado

El subsistema en `rag/` captura evidencias del ciclo de vida en SQLite y soporta:

- Inicializacion y reseteo de base.
- Captura de evidencia por CLI.
- Busqueda sobre evidencia.
- Vectorizacion local.
- Calculo de score de madurez.
- Gate de certificacion por umbral.

### 3. Auditoria y trazabilidad

La informacion queda organizada para saber `que`, `cuando`, `quien`, `por que` y `con que resultado` ocurrio cada evento relevante del pipeline.

### 4. RAG y memoria operativa local

El framework esta orientado a usar conocimiento local del repo y artefactos de proyecto para reducir contexto perdido, mejorar continuidad y permitir consultas sobre decisiones, patrones y evidencia previa.

## Arquitectura resumida

```text
Framework-SDD/
|- .data/
|  |- framework-sdd-audit.db
|  \- logs/
|- docs/
|- openspec/
|- rag/
|  |- package.json
|  |- schema/
|  \- scripts/
|- develop/
|- evidence/
|- engineering-knowledge-base/
|- scripts/
|- tests/
\- .claude/
```

### Subsistema `rag/`

El directorio `rag/` contiene el nucleo ejecutable del sistema de evidencia.

Scripts actuales:

- `rag/scripts/init-db.mjs`: crea, resetea y verifica la base SQLite.
- `rag/scripts/capture-evidence.mjs`: captura evidencia desde CLI.
- `rag/scripts/search.mjs`: consulta evidencia almacenada.
- `rag/scripts/vectorize.mjs`: genera embeddings locales.
- `rag/scripts/maturity-score.mjs`: calcula score y certifica el flujo.

Schema actual:

- `rag/schema/init.sql`: DDL principal del sistema de evidencia.

Configuracion npm en `rag/package.json`:

- `evidence:init`
- `evidence:init-reset`
- `evidence:init-check`
- `evidence:capture`
- `evidence:search`
- `evidence:vectorize`
- `evidence:export`
- `evidence:score`
- `evidence:score:all`
- `evidence:certify`

## Modelo de evidencia

El sistema trabaja con tipos de evidencia como:

- `code`
- `test`
- `review_comment`
- `review_decision`
- `verification` o `verification_matrix` segun schema
- `deployment_report`

Cada evidencia puede incluir:

- `change_slug`
- `task_id`
- contenido textual
- `metadata` JSON
- severidad
- fuente
- hash para deduplicacion
- timestamps

La base tambien mantiene trail de auditoria y vectores para busqueda semantica.

## Pipeline de madurez y certificacion

El score de madurez actual se calcula sobre 7 dimensiones ponderadas:

| Dimension | Peso |
|---|---:|
| Evidencia de codigo | 15% |
| Evidencia de tests ejecutados | 15% |
| Tests pasando | 20% |
| Review aprobado | 15% |
| Verificacion aprobada | 15% |
| Despliegue exitoso | 10% |
| Vectorizacion activa | 10% |

Umbral de certificacion actual:

- `95%` o superior => certificado.

Resultado ya validado en este repo:

- `100%` total ponderado.
- `Nivel 5/5`.
- Validado tanto por ejecucion directa de scripts como por wrappers `npm` desde `rag/`.

## Quick start

### Opcion 1: operar desde `rag/`

```bash
cd rag
npm install
npm run evidence:init-reset
```

Capturar evidencia manual:

```bash
npm run evidence:capture -- --type=code --change=demo-change --title='codigo' --description='implementacion' --metadata='{"task_id":"T01"}'
npm run evidence:capture -- --type=test --change=demo-change --title='tests' --description='ok' --metadata='{"passed":true}'
npm run evidence:capture -- --type=review_decision --change=demo-change --title='review' --description='approved' --metadata='{"decision":"approve"}'
npm run evidence:capture -- --type=verification --change=demo-change --title='verify' --description='passed' --metadata='{"passed":true}'
npm run evidence:capture -- --type=deployment_report --change=demo-change --title='deploy' --description='success' --metadata='{"status":"success"}'
```

Vectorizar y certificar:

```bash
npm run evidence:vectorize -- --change=demo-change
npm run evidence:certify -- --change=demo-change
```

### Opcion 2: operar desde el root

Tambien puedes ejecutar los scripts directamente desde el root del repo:

```bash
node rag/scripts/init-db.mjs --reset --check
node rag/scripts/capture-evidence.mjs --type=code --change=demo-change --title='codigo' --description='implementacion' --metadata='{"task_id":"T01"}'
node rag/scripts/vectorize.mjs --change=demo-change
node rag/scripts/maturity-score.mjs --change=demo-change --threshold=95
```

Importante: los scripts actuales resuelven correctamente el workspace root tanto si se ejecutan desde el root como desde `rag/`.

## Comandos utiles

### Inicializacion

```bash
cd rag
npm run evidence:init
npm run evidence:init-reset
npm run evidence:init-check
```

### Captura y consulta

```bash
cd rag
npm run evidence:capture -- --type=test --change=my-change --title='suite' --description='resultado' --metadata='{"passed":true}'
npm run evidence:search -- "auth"
```

### Vectorizacion y scoring

```bash
cd rag
npm run evidence:vectorize -- --change=my-change
npm run evidence:score -- --change=my-change
npm run evidence:certify -- --change=my-change
```

## Integracion con el ciclo `/gd:*`

La documentacion del repo define integracion de evidencia para estas fases:

- `/gd:start`
- `/gd:implement`
- `/gd:test-Backend`
- `/gd:test-Frontend`
- `/gd:review`
- `/gd:verify`
- `/gd:close`
- `/gd:release`
- `/gd:deploy`
- `/gd:archive`

Reglas de bloqueo documentadas:

- No pasar de implementacion a test sin evidencia de codigo.
- No pasar de test a review sin tests exitosos.
- No pasar de review a verify sin aprobacion.
- No pasar de verify a close sin verificacion exitosa.
- No archivar sin evidencia de despliegue exitoso.

## Documentacion clave

- `docs/ARCHITECTURE-EVIDENCE-AUDIT.md`: arquitectura objetivo del sistema de auditoria y evidencia.
- `docs/IMPLEMENTATION-GUIDE.md`: setup, comandos, esquema y troubleshooting.
- `docs/INTEGRATION-GUIDE.md`: puntos de integracion en el lifecycle `/gd:*`.
- `EVIDENCE-SYSTEM-SUMMARY.md`: resumen ejecutivo del sistema de evidencia.
- `EVIDENCE_CORE_CERTIFICATION.md`: certificacion operativa del modulo core GoodERP.
- `OPENCODE.md`: reglas ultra-light y optimizacion de contexto para OpenCode/Copilot.
- `openspec/config.yaml`: reglas de trabajo OpenSpec para este repo.

## Directorios importantes del repo

No todo en este repositorio es el framework base. Estas son las zonas mas importantes para orientarte:

- `.claude/`: comandos y flujos de trabajo del agente.
- `.data/`: base SQLite y logs del sistema de evidencia.
- `develop/`: espacio de cambios y desarrollos SDD.
- `docs/`: arquitectura e integracion.
- `engineering-knowledge-base/`: base de conocimiento persistente.
- `evidence/`: artefactos de evidencia del proyecto.
- `openspec/`: configuracion y contratos de especificacion.
- `packages/`: componentes o paquetes del ecosistema.
- `rag/`: runtime del sistema de evidencia y RAG local.
- `scripts/`: plantillas y utilitarios adicionales.
- `tests/` y `test-results/`: pruebas y resultados.

Adicionalmente, este repo incluye muchos scripts y archivos operativos del dominio `sigat-client`, por ejemplo:

- pruebas API
- validaciones CORS
- payloads y responses de diagnostico
- scripts de despliegue y verificacion
- evidencia de certificacion funcional

## Decisiones tecnicas relevantes

- SQLite fue elegido sobre PostgreSQL para la capa de evidencia por portabilidad, simplicidad y cero friccion operativa.
- El sistema usa hashes para deduplicacion de evidencia.
- La vectorizacion actual es local y deterministica.
- Los scripts fueron endurecidos para tolerar variantes de schema y diferencias de ejecucion entre root y `rag/`.
- El score de madurez ya es una gate operativa, no solo un reporte.

## Estado real de implementacion

### Funcional hoy

- Base SQLite inicializable y verificable.
- Captura CLI con `--type`, `--title`, `--description`, `--metadata`.
- Alias `deployment_report` funcional.
- Vectorizacion local funcional.
- Score y certificacion funcionales.
- Compatibilidad con schema actual basado en IDs tipo texto/UUID.
- Validacion end-to-end ya ejecutada con resultado `100% CERTIFICADO`.

### Parcial o dependiente de integracion adicional

- Insercion automatica total dentro de todos los comandos `/gd:*`.
- Hooks y automatizaciones adicionales fuera del flujo manual actual.
- Dashboard visual y exportes mas avanzados.

## Troubleshooting rapido

### 1. La base parece inconsistente

```bash
cd rag
npm run evidence:init-reset
```

### 2. El score no llega a 100%

Revisa que existan las 7 piezas del flujo:

- codigo
- test ejecutado
- tests pasando
- review aprobado
- verificacion aprobada
- deploy exitoso
- vectorizacion

### 3. Ejecutaste desde `rag/` y desde root y viste comportamientos distintos

Los scripts actuales ya corrigen ese problema usando resolucion de workspace root. Si reaparece, el primer chequeo debe ser que ambos caminos apunten al mismo `.data/framework-sdd-audit.db`.

## Referencia rapida

```bash
cd rag
npm install
npm run evidence:init-reset
npm run evidence:capture -- --type=code --change=my-change --title='code' --description='done' --metadata='{"task_id":"T01"}'
npm run evidence:vectorize -- --change=my-change
npm run evidence:certify -- --change=my-change
```

## Resumen ejecutivo

Framework-SDD en este repositorio ya no es solo una idea o una propuesta documental. Tiene una base operativa real para:

- gobernar cambios por fases,
- exigir evidencia para avanzar,
- consultar historial tecnico,
- medir madurez del flujo,
- y certificar objetivamente la ejecucion.