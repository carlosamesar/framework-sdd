# OpenSpec (Framework-SDD)

Este directorio concentra **especificaciones en delta** bajo `changes/`. La estructura modular `modules/XX-module-*/changes/` descrita en `project.md` aplica cuando el monorepo incluye el árbol ERP completo; en repos mínimos basta con `openspec/changes/<slug>/`.

| Archivo | Rol |
|---------|-----|
| `MEMORY.md` | Enlaces a memoria SDD, RAG, índice de documentación |
| `config.yaml` | Rutas y reglas consumidas por `npm run spec:validate` |
| `changes/<slug>/proposal.md` | Intención y alcance (recomendado) |
| `changes/<slug>/design.md` | Arquitectura y decisiones |
| `changes/<slug>/tasks.md` | Checklist con `- [ ]` / `- [x]` |
| `changes/<slug>/specs/**/*.md` | Requisitos y escenarios (Gherkin o **Dado/Cuando/Entonces**) |
| `templates/react-outputs/*.schema.json` | Esquemas JSON de salida para encadenar agentes (ReAct) |
| `tools-manifest.yaml` | Registro de herramientas para orquestación |

Validación: desde la raíz del repo, `npm run spec:validate`. Reportes de checklist: `npm run spec:verify -- <slug>`.
