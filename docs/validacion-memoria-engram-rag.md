# Validación: memoria persistente (Engram) y RAG

**Fecha:** 2026-04-08 (actualizado 2026-04-09)  
**Índice general:** [`INDICE-DOCUMENTACION-FRAMEWORK.md`](INDICE-DOCUMENTACION-FRAMEWORK.md)

**Contexto:** El directorio de datos Engram vive en el repositorio **`engineering-knowledge-base`** (anidado bajo Framework-SDD). Las auditorías anteriores indicaban “RAG/Engram ausente en el árbol” porque **`engineering-knowledge-base/` está en `.gitignore` del repo padre** `Framework-SDD`: no forma parte del índice git del framework, pero **sí debe existir en disco** como clon independiente con su propio `.git`.

---

## 1. Engram — estado verificado (entorno local)

| Comprobación | Resultado |
|--------------|-----------|
| Ruta esperada `Framework-SDD/engineering-knowledge-base/` | **Presente** (contiene `engram.db`, `.engram/`, `.git`, `ENGRAM.md`) |
| Variables en `scripts/engram.sh` | `ENGRAM_DATA_DIR` apunta al EKB; `ENGRAM_PROJECT=framework-sdd` (por defecto) |
| Daemon `scripts/engram-sync-daemon.sh` | Usa `ENGRAM_DATA_DIR`, `ENGRAM_BIN`, `ENGRAM_GIT_TOKEN` (solo entorno), push a rama actual |
| Rama del repo EKB | `master` (coincide con `git push` dinámico) |
| Binario `engram` | Debe estar en `$HOME/go/bin` (o `ENGRAM_BIN`) |

### Documentación en EKB

`engineering-knowledge-base/ENGRAM.md` describe proyectos (`framework-sdd`, `gooderp-client`, `gooderp-orchestation`) y variables; coherente con `AGENTS.md`.

---

## 2. Por qué “no aparecía” en el árbol del framework

- **`.gitignore` (Framework-SDD) línea `engineering-knowledge-base/`** excluye el clon del commit del monorepo principal.
- **Herramientas de búsqueda** que solo indexan archivos trackeados pueden no listar EKB.
- **Conclusión:** La memoria Engram **no está “falta”** si el clon existe localmente; está **desacoplada por diseño** del historial git del framework.

---

## 3. MCP Cursor (`user-engram`)

En la configuración MCP del proyecto, el servidor **engram** puede aparecer en error (`STATUS.md`: server errored). Eso **no invalida** la `.db` local; implica:

- Revisar **Cursor Settings → MCP** (servidor `user-engram` encendido, ruta/credenciales).
- Que el binario Engram y `ENGRAM_DATA_DIR` coincidan con lo que espera el servidor MCP.

---

## 4. RAG (`rag/`) — distinto de Engram

| Componente | En Framework-SDD (padre) |
|------------|---------------------------|
| **`rag/`** (pgVector, `scripts/query.mjs`, etc.) | **Presente** en el repo; ver [`rag/README.md`](../rag/README.md) |
| **Engram + SQLite `engram.db`** | En `engineering-knowledge-base/` (repo anidado, gitignored en el padre) |

**Engram** = observaciones / sesiones (`mem_*`). **RAG** = chunks vectoriales sobre Markdown del framework. Son complementarios.

---

## 5. Seguridad (acción obligatoria si hubo token en repo)

Históricamente `engram-sync-daemon.sh` contenía un **PAT de GitHub en claro**. Eso fue **eliminado**: el push con autenticación usa solo **`ENGRAM_GIT_TOKEN`** en el entorno.

- **Revocar** en GitHub cualquier token que haya estado commiteado y **generar uno nuevo**.
- Antes de `start` del daemon: `export ENGRAM_GIT_TOKEN=<nuevo_pat>` (o variable en systemd `Environment=`).

---

## 6. Checklist operativo

1. `git clone … engineering-knowledge-base` dentro de Framework-SDD (como en `README.md`).
2. `~/.config/framework-sdd/engram-daemon.env` con `ENGRAM_GIT_TOKEN` / `ENGRAM_DATA_DIR` para push automático.
3. **Daemons obligatorios (lineamiento):** `./scripts/start-memory-daemons.sh` o systemd — ver [`lineamiento-memoria-automatica.md`](lineamiento-memoria-automatica.md).
4. `./scripts/engram.sh` o MCP con `ENGRAM_DATA_DIR` correcto.
5. RAG: `npm run rag:db:up` (opcional, Postgres local Docker), `npm run rag:migrate`, Ollama/OpenAI, `npm run rag:index`, daemon `rag-index-daemon.sh`.

---

## 7. Resumen

| Pregunta | Respuesta |
|----------|-----------|
| ¿La `.db` está en EKB? | **Sí**, en el repo anidado `engineering-knowledge-base`. |
| ¿Por qué el audit dijo “no en el árbol”? | Por **gitignore + índice del padre**, no por ausencia física. |
| ¿RAG = Engram? | **No**; RAG (`rag/`) **sí está** en Framework-SDD; Engram vive en EKB. RAG requiere Postgres pgvector + embeddings para ser útil. |
| ¿Config válida? | **Sí**, con rutas portables en scripts y token solo por entorno. |
