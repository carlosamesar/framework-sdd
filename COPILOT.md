# COPILOT.md — Ultra-Light

GitHub Copilot debe operar con contexto mínimo y reglas estrictas.

## Base obligatoria
- seguir `AGENTS.md` como índice maestro;
- usar `/gd:start` si la petición es ambigua;
- no saltar `review`, `verify` ni `close`;
- no declarar éxito sin evidencia real;
- `tenantId` siempre sale del JWT.

## Ahorro de tokens
- cargar solo este archivo + `AGENTS.md`;
- abrir `COMMANDS-INDEX.md` solo si hay un comando `gd:*`;
- cargar un solo módulo de `.agents-core/` por tarea;
- reutilizar snippets de `PATTERNS-CACHE.md`.

La instrucción automática principal vive en `.github/copilot-instructions.md`.
