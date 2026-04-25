# Token Optimization Strategy

## Objetivo

Mantener un contexto base muy pequeno y mover el detalle a archivos de carga por demanda para Claude, Copilot, OpenCode y Qwen.

## Arquitectura

1. Un entrypoint minimo por herramienta.
2. Un conjunto de indices compartidos pequenos.
3. Modulos de dominio en `.agents-core/` cargados solo cuando la tarea lo necesita.

## Entry points

- `CLAUDE.md`
- `.github/copilot-instructions.md`
- `OPENCODE.md`
- `QWEN.md`

## Indices compartidos

- `AGENTS.md`: reglas globales y politica de carga.
- `COMMANDS-INDEX.md`: catalogo corto de `/gd:*`.
- `PATTERNS-CACHE.md`: rutas a patrones maduros.

## Modulos on-demand

- `.agents-core/multi-tenant.md`
- `.agents-core/lambdas-pattern.md`
- `.agents-core/nestjs-pattern.md`
- `.agents-core/testing-rules.md`
- `.agents-core/saga-pattern.md`

## Politica de uso

1. Arrancar siempre con el entrypoint de la herramienta.
2. Agregar solo un indice o modulo adicional por tarea.
3. Evitar cargar documentacion extensa o todos los comandos juntos.
4. Referenciar rutas y patrones, no repetirlos en el prompt.

## Resultado esperado

- Contexto base estimado: sub-1k tokens por herramienta.
- Tarea normal con un modulo adicional: 1.2k a 2.2k tokens.
- Frente a una carga amplia de docs, comandos y reglas: ahorro objetivo superior al 95%.