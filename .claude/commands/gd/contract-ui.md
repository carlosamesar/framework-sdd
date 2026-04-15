# `/gd:contract-ui` — Contratos de UI, Estados y Datos Esperados

## Propósito
Definir la interfaz estable entre la experiencia de usuario y las fuentes de datos: props, estados, acciones, eventos, mensajes de error y expectativas de renderizado.

---

## Qué valida

- campos y formatos consumidos por la UI;
- estados vacíos, loading y error;
- interacción entre componentes;
- consistencia visual y semántica del flujo.

---

## Uso típico

- antes de construir una pantalla o componente nuevo;
- cuando el backend cambia payloads;
- al depurar bugs por datos incompletos o estados inconsistentes.

---

## Formato sugerido

```markdown
## UI Contract
**Vista/Componente**: [nombre]

### Entradas
- [dato 1]
- [dato 2]

### Estados
- loading
- empty
- success
- error

### Comportamiento esperado
- [regla clave]
```

---

## Inputs recomendados

- vista o componente afectado
- datos que consume o emite
- estados de UX que deben cubrirse
- criterio de consistencia esperado

## Output esperado

- contrato de datos y estados claro
- expectativas de render y comportamiento
- riesgos por inconsistencia detectados
- siguiente validación recomendada

## Integración sugerida

- usar junto con contract-api en cambios full-stack
- revisar loading, empty y error states explícitamente
- validar con testing antes de cerrar la interfaz

## Criterios de calidad

- claridad entre entradas, estados y salidas
- cobertura de casos no felices
- consistencia con el comportamiento esperado
- utilidad inmediata para frontend y backend

## Anti-patrones a evitar

- definir solo el estado ideal
- ignorar errores o vacíos de datos
- mezclar contrato visual con capricho de diseño
- omitir eventos o interacciones críticas

## Ejemplo de solicitud

```text
/gd:contract-ui definir estados para vista de conciliación bancaria
```

## Siguiente paso

Usar junto con `/gd:contract-api`, `/gd:testing` y `/gd:review`.