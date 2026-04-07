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

## 📝 Notas Adicionales
1. **Memoria Persistente:** El framework usa Engram. Si necesitas que el agente recuerde algo de sesiones pasadas, usa `/gd:recall`.
2. **Cierre de Sesión:** Antes de terminar tu trabajo, usa `/gd:close` para que el agente guarde un resumen estructurado.
3. **Detección de Complejidad:** El framework ajustará automáticamente las fases de desarrollo (Nivel 0 al 4) según la magnitud de tu solicitud.

---
*GAF Framework - Specification-Driven Development - Grupo 4D*
