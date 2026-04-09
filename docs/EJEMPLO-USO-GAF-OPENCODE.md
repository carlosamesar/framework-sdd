# Guía de Instalación y Uso: Framework GAF (SDD) en OpenCode

Esta guía detalla cómo instalar y poner en funcionamiento el Framework GAF (Specification-Driven Development) para trabajar de manera eficiente con agentes de IA en este repositorio.

## 🚀 Instalación Rápida

Para instalar los comandos y configurar tu entorno, sigue estos pasos desde la raíz del proyecto:

### 1. Inicializar el Framework
Ejecuta el script de inicialización para crear los comandos y configurar los alias en tu terminal:

```bash
./scripts/gd-init.sh
```

### 2. Activar los Alias
Para que tu terminal reconozca los nuevos comandos (`gd:status`, `gd:doctor`, etc.), activa tu configuración de bash:

```bash
source ~/.bashrc
```

### 3. Verificar la Instalación
Comprueba que todo esté correcto ejecutando:

```bash
gd:doctor
```
Deberías ver: `Checking framework health... GAF commands: OK`

---

## 🛠️ Comandos Disponibles

El framework GAF utiliza el prefijo `/gd:` dentro del chat de OpenCode y el prefijo `gd:` en la terminal.

### 📋 Comandos de Terminal (Básico)
| Comando | Descripción |
|---------|-------------|
| `gd:init` | Re-inicializa el framework y los alias. |
| `gd:status` | Lista todos los comandos y su ubicación. |
| `gd:doctor` | Verifica la integridad de la instalación. |

### 🤖 Comandos de Chat (SDD Pipeline)
Usa estos comandos directamente en el chat de OpenCode para orquestar el desarrollo:

- `/gd:start "<tarea>"`: Inicia una nueva tarea con detección de complejidad.
- `/gd:specify`: Genera especificaciones Gherkin desde una idea.
- `/gd:plan`: Crea el blueprint técnico y arquitectura.
- `/gd:implement`: Ejecuta el ciclo TDD (RED -> GREEN -> REFACTOR).
- `/gd:review`: Realiza una auditoría técnica de 7 dimensiones.
- `/gd:verify`: Valida la implementación contra la especificación.
- `/gd:archive`: Sincroniza delta specs a specs principales y archiva el cambio.

### 🧠 Modelos de Razonamiento
Puedes invocar razonamientos profundos ante problemas complejos:

- `/gd:razonar:primeros-principios`: Descomponer a verdades fundamentales.
- `/gd:razonar:5-porques`: Análisis de causa raíz.
- `/gd:razonar:pareto`: Enfoque en el 20% de mayor impacto.
- `/gd:razonar:pre-mortem`: Anticipar fallos antes de que ocurran.
- `/gd:razonar:minimizar-arrepentimiento`: Tomar la decisión con menos arrepentimiento futuro.
- `/gd:razonar:segundo-orden`: Evaluar consecuencias de las consecuencias.

---

## 📂 Estructura del Framework

- `.claude/commands/gd/`: Definiciones de comandos de chat.
- `.claude/commands/gd:razonar/`: Modelos de razonamiento especializados.
- `scripts/gd-init.sh`: Script de configuración de entorno.
- `AGENTS.md`: Contrato maestro y referencia completa de reglas.

## 💡 Ejemplo de Flujo de Trabajo

**Usuario:** `/gd:start "Crear microservicio de contabilidad"`

**Agente:**
1. Detecta complejidad (Nivel 3 - Complex).
2. Propone fases: Specify -> Plan -> Implement.
3. El usuario aprueba y se usa `/gd:specify` para definir los escenarios Gherkin.
4. Se usa `/gd:tech-plan` para el diseño técnico (TypeORM, NestJS).
5. Se ejecuta `/gd:implement` para escribir el código siguiendo TDD.

---

## OpenSpec y CI (Node en la raíz)

Desde la raíz de Framework-SDD (Node 20+):

| Comando | Uso |
|---------|-----|
| `npm install` | Dependencias del validador (una vez) |
| `npm run spec:validate` | Estructura `openspec/changes/` |
| `npm run spec:validate-react` | Esquemas JSON ReAct + ejemplos (Ajv) |
| `npm run framework:ci` | Ambos (como en CI) |
| `npm run spec:verify -- <slug>` | Reporte JSON en `reports/` |

Índice de documentación: [`docs/INDICE-DOCUMENTACION-FRAMEWORK.md`](INDICE-DOCUMENTACION-FRAMEWORK.md).

---

## RAG y Postgres (opcional)

El código RAG está en `rag/`. Para consultas semánticas sobre documentación:

1. `rag/.env` desde `rag/.env.example` (BD y proveedor de embeddings).
2. Postgres con pgvector: `npm run rag:db:up` (Docker; detalle en [`rag/README.md`](../rag/README.md)).
3. `npm run rag:migrate` → `npm run rag:index` → `npm run rag:query -- "tu pregunta"`.

Para mantener el índice actualizado en desarrollo, usar los daemons descritos en [`lineamiento-memoria-automatica.md`](lineamiento-memoria-automatica.md).

---

## 📝 Notas Adicionales
1. **Memoria persistente (Engram):** datos en `engineering-knowledge-base/`; MCP `mem_*` y daemons de sync. Guía: [`lineamiento-memoria-automatica.md`](lineamiento-memoria-automatica.md).
2. **RAG:** complementa Engram para búsqueda en Markdown del repo; ver arriba y [`openspec/MEMORY.md`](../openspec/MEMORY.md).
3. **Memoria en el chat:** si necesitas contexto de sesiones previas en flujo GAF, usa `/gd:recall` cuando esté disponible en tu instalación.
4. **Cierre de sesión:** antes de terminar, `/gd:close` para resumen estructurado (alineado a `AGENTS.md`).
5. **Detección de complejidad:** el framework ajusta fases (nivel 0–4) según la magnitud de la solicitud.
6. **Orquestador terminal (`sdd-agent`):** instalación local [`orquestador-agente-sdd.md`](orquestador-agente-sdd.md); **CI y producción** [`orquestador-produccion.md`](orquestador-produccion.md) (`npm run agent:install:production`, secretos, `pipeline` vs `gd-cycle`).

---
*GAF Framework - Specification-Driven Development - Grupo 4D*
