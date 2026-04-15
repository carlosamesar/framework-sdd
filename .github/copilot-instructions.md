# GitHub Copilot — Ultra-Light Workspace Rules

## Base obligatoria
- usar `AGENTS.md` como índice maestro;
- si la tarea es ambigua, comenzar por `/gd:start`;
- no saltar `/gd:review`, `/gd:verify` ni `/gd:close`;
- no declarar completado sin evidencia real;
- `tenantId` siempre sale del JWT.

## Política de tokens
- cargar solo esta instrucción + `AGENTS.md` por defecto;
- abrir `COMMANDS-INDEX.md` solo si hay un comando `gd:*`;
- cargar un solo módulo de `.agents-core/` según la tarea;
- reutilizar `PATTERNS-CACHE.md` en lugar de reexplicar patrones.

## Cierre
Mantener `CONSUMO.md` y `EVIDENCE.md` alineados cuando aplique.
