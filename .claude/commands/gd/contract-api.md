# `/gd:contract-api` — Definir y Validar Contratos de Integración entre Servicios

## Propósito
Asegurar que las interfaces entre servicios se mantengan estables, explícitas y verificables. Aplica a REST, GraphQL, eventos o integraciones internas entre módulos.

---

## Qué cubre

- shape de requests y responses;
- códigos de error esperados;
- versionado o compatibilidad;
- validaciones de entrada;
- invariantes de negocio críticas.

---

## Cuándo usarlo

- antes de implementar una nueva integración;
- al detectar rompimientos entre frontend y backend;
- cuando cambia un endpoint público o un payload compartido.

---

## Salida esperada

```markdown
## API Contract
**Interfaz**: [servicio A] -> [servicio B]

### Request
- campos obligatorios
- validaciones

### Response
- schema esperado
- errores previstos

### Compatibilidad
- compatible | requiere migración
```

---

## Reglas

- no cambiar contratos públicos sin documentación;
- toda incompatibilidad debe marcar impacto y mitigación;
- preferir validación temprana y errores claros.

---

## Inputs recomendados

- endpoints, eventos o interfaces implicadas
- consumidores y productores del contrato
- cambios previstos o incompatibilidades sospechadas
- criterio de compatibilidad aceptable

## Output esperado

- contrato explícito de request y response
- cambios incompatibles visibilizados
- validaciones recomendadas
- siguiente paso técnico sugerido

## Integración sugerida

- revisar antes de publicar cambios de API
- enlazar con testing de contrato y verify
- coordinar con contract-ui si impacta frontend

## Criterios de calidad

- definición clara de entradas y salidas
- manejo explícito de errores y edge cases
- trazabilidad de compatibilidad o migración
- utilidad práctica para quienes integran la API

## Anti-patrones a evitar

- cambiar payloads sin documentar impacto
- ignorar casos de error o timeouts
- asumir compatibilidad por similitud superficial
- olvidar consumidores secundarios de la interfaz

## Ejemplo de solicitud

```text
/gd:contract-api revisar compatibilidad del endpoint de conciliación
```

## Siguiente paso

Complementar con `/gd:testing` y `/gd:verify` para validar el contrato en ejecución.