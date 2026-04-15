# `/gd:agente` — Seleccionar y Orquestar el Agente Correcto para Cada Tipo de Trabajo

## Propósito
Elegir el perfil de agente más adecuado según el problema: implementación, arquitectura, seguridad, frontend, QA o coordinación. Este comando evita usar un enfoque genérico donde conviene especialización.

---

## Cuándo usarlo

- antes de iniciar una tarea compleja;
- cuando el trabajo cambia de dominio técnico;
- al delegar un subproblema específico a otro perfil.

---

## Resultado esperado

```markdown
## Agent Selection
- agente recomendado
- motivo de selección
- tipo de tarea que asumirá
- límites o riesgos a vigilar
```

---

## Reglas

- elegir por especialidad y no por costumbre;
- si hay dudas entre dos perfiles, priorizar el de menor riesgo arquitectónico;
- la selección debe quedar justificada.

---

## Inputs recomendados

- naturaleza exacta de la tarea
- dominio técnico predominante
- riesgo principal a controlar
- necesidad de especialización o delegación

## Output esperado

- agente recomendado con justificación
- alcance de su intervención
- riesgos o límites de uso
- siguiente paso coherente con la selección

## Integración sugerida

- elegir agente antes de tareas complejas o ambiguas
- revisar si el trabajo cambió de dominio a mitad del flujo
- mantener consistencia con las reglas del proyecto

## Criterios de calidad

- selección basada en especialidad real
- claridad sobre por qué ese perfil ayuda más
- reducción del riesgo por mala asignación
- continuidad limpia con el pipeline SDD

## Anti-patrones a evitar

- usar siempre el mismo perfil por inercia
- delegar sin definir alcance
- ignorar restricciones del agente elegido
- cambiar de agente sin motivo claro

## Ejemplo de solicitud

```text
/gd:agente seleccionar perfil adecuado para remediación de NestJS
```

## Siguiente paso

Luego de elegir agente, continuar con `/gd:start`, `/gd:plan` o `/gd:implement`.