# /gd:roundtable — Discusión Multi-Perspectiva: CPO, UX, Business

## Propósito
Simular una discusión de mesa redonda entre diferentes perspectivas de negocio (CPO, UX, Business) para validar decisiones desde múltiples ángulos antes de la implementación.

## Cómo Funciona

1. **Perspectiva CPO (Chief Product Officer)**: Enfocada en estrategia de producto, roadmap, valor de negocio y diferenciación competitiva
2. **Perspectiva UX (User Experience)**: Centrada en usabilidad, accesibilidad, flujo de usuario y satisfacción del cliente
3. **Perspectiva Business**: Orientada a impacto financiero, ROI, riesgos operativos y alineación con objetivos de negocio

## Proceso de Discusión

```
Para cada aspecto de la propuesta:
  1. CPO evalúa: ¿Alineado con visión de producto? ¿Diferenciador competitivo?
  2. UX evalúa: ¿Fácil de usar? ¿Accesible? ¿Mejora la experiencia?
  3. Business evalúa: ¿Impacto financiero positivo? ¿Riesgos aceptables?
  4. Se identifican puntos de conflicto y sinergia
  5. Se genera consenso o se documentan desacuerdos para resolución
```

## Salida del Comando

- **Perspectiva CPO**: Opiniones, preocupaciones y recomendaciones desde estrategia de producto
- **Perspectiva UX**: Hallazgos de usabilidad, sugerencias de mejora y preocupaciones de accesibilidad
- **Perspectiva Business**: Análisis de costo-beneficio, evaluación de riesgos y impacto en métricas clave
- **Áreas de Consenso**: Puntos donde las tres perspectivas coinciden
- **Puntos de Conflicto**: Discrepacias que requieren resolución o decisión ejecutiva
- **Recomendaciones Integradas**: Sugerencias que balancean las tres perspectivas

## Uso

```
/gd:roundtable [descripción de la característica o decisión a evaluar]
```

## Alias
- `/gd:mesa-redonda`

## Parámetros Opcionales

- `--depth=nivel`: Profundidad de análisis (1=básico, 2=intermedio, 3=avanzado)
- `--stakeholders=lista`: Incluir perspectivas adicionales (legal, security, ops, etc.)
- `--formato=salida`: Formato del reporte (markdown, json, texto)

## Ejemplo

```
/gd:roundtable Implementar sistema de recomendaciones basado en ML para productos
```

## Siguiente Paso
Usar los insights de la mesa redonda para refinar la especificación con `/gd:specify` o identificar necesidad de más investigación con `/gd:explore`.