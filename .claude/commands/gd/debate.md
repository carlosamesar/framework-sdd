# /gd:debate — Debate Adversarial: PM vs Architect vs QA

## Propósito
Simular un debate estructurado y adversarial entre tres roles críticos (Product Manager, Architect, QA Engineer) para evaluar propuestas desde perspectivas potencialmente conflictivas y generar decisiones más robustas.

## Cómo Funciona

1. **Perspectiva PM (Product Manager)**: Enfocada en valor de negocio, necesidades de usuario, tiempo de mercado y prioridades estratégicas
2. **Perspectiva Architect**: Centrada en integridad técnica, sostenibilidad a largo plazo, deuda técnica y alineación con visión arquitectónica
3. **Perspectiva QA (Quality Assurance)**: Orientada a calidad, testabilidad, riesgos, cumplimiento y experiencia de usuario libre de defectos

## Proceso de Debate

```
Para cada aspecto de la propuesta:
  1. PM argumenta: ¿Entrega valor real? ¿Resuelve problema de usuario? ¿Es prioritario?
  2. Architect contrargumenta: ¿Es técnicamente sostenible? ¿Genera deuda técnica? ¿Encaja en arquitectura?
  3. QA interrogatorio: ¿Cómo se prueba? ¿Cuáles son los riesgos? ¿Qué podría fallar?
  4. Réplicas y contra-réplicas entre roles
  5. Buscar puntos de compromiso o identificar decisiones necesarias de liderazgo
  6. Documentar consenso o desacuerdos irreconciliables
```

## Salida del Comando

- **Posición PM**: Argumentos a favor basado en valor de negocio y necesidades de usuario
- **Posición Architect**: Preocupaciones técnicas, implicaciones de diseño y alternativa sugeridas
- **Posición QA**: Riesgos identificados, desafíos de testing y requisitos de calidad
- **Puntos de Acuerdo**: Aspectos donde las tres perspectivas coinciden
- **Puntos de Conflicto**: Discrepacias que requieren resolución ejecutiva o de liderazgo
- **Compromisos Propuestos**: Soluciones intermedias que abordan preocupaciones múltiples
- **Decisiones Necesarias**: Items que requieren decisión de gerencia o liderazgo técnico
- **Riesgos Identificados**: Amenazas potenciales destacados por QA
- **Oportunidades de Mejora**: Sugerencias que surgieron del intercambio adversarial

## Uso

```
/gd:debate [propuesta, característica o decisión a debatir]
```

## Alias
- `/gd:debate`

## Parámetros Opcionales

- `--rounds=número`: Número de rondas de intercambio (por defecto: 3)
- `--moderador=rol`: Especificar rol de moderador (pm, architect, qa, neutral)
- `--formato=salida`: Formato del reporte de debate (markdown, json, texto)
- `--registro`: Guardar transcripción completa del debate para archivo

## Ejemplo

```
/gd:debate Implementar autenticación biométrica en aplicación móvil de pagos
```

## Criterios para Decisión

Después del debate, considerar:
- ✅ **Alineación Estratégica**: PM ve claro valor de negocio
- ✅ **Viabilidad Técnica**: Architect considera sostenible a largo plazo
- ✅ **Gestión de Riesgos**: QA tiene plan para mitigar preocupaciones identificadas
- ✅ **Compromiso Posible**: Existen puntos de acuerdo para construir solución
- ✅ **Decisión Clara**: Puntos de conflicto tienen camino hacia resolución

## Siguiente Paso
Usar los insights del debate para refinamiento de especificación con `/gd:specify` o planificación técnica con `/gd:plan`, dependiendo de dónde se encuentren los principales desacuerdos.