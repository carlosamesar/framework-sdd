# COMMANDS-INDEX.md — Ultra-Light

Usar solo el comando solicitado.

## Stacks y Proyectos Soportados
| --stack | --project | Ruta |
|---------|---------|------|
| frontend | sigat | /develop/frontend/sigat-client |
| frontend | gooderp | /develop/frontend/gooderp-client |
| backend | sigat | /develop/backend/sigat-orchestation |
| backend | gooderp | /develop/backend/gooderp-orchestation |

## Pipeline
- /gd:start [--stack=<stack>] [--project=<project>] "descripción"
- /gd:implement
- /gd:review
- /gd:verify
- /gd:close
- /gd:deploy
- /gd:archive

## Áreas
- clarificar: /gd:clarify, /gd:specify, /gd:plan
- calidad: /gd:review, /gd:test-unit, /gd:e2e, /gd:doctor
- entrega: /gd:deploy, /gd:release, /gd:changelog
- memoria: /gd:rag, /gd:recall, /gd:session

Si falta detalle, abrir solo el archivo específico en .claude/commands/gd/
