# /gd:tech-panel — Panel de Expertos: Tech Lead, Backend, Frontend, Architect

## Propósito
Simular un panel técnico con diferentes roles de ingeniería (Tech Lead, Backend, Frontend, Architect) para evaluar decisiones técnicas desde múltiples perspectivas de especialización.

## Cómo Funciona

1. **Perspectiva Tech Lead**: Enfocada en calidad técnica, estándares de código, mentoring y alineación con prácticas de ingeniería
2. **Perspectiva Backend**: Centrada en APIs, bases de datos, rendimiento, escalabilidad y arquitectura de servidor
3. **Perspectiva Frontend**: Orientada a experiencia de usuario, rendimiento de navegador, accesibilidad y mantenimiento de UI
4. **Perspectiva Architect**: Enfocada en decisiones estructurales, patrones de diseño, acoplamiento y evolución a largo plazo

## Proceso de Evaluación

```
Para cada decisión técnica:
  1. Tech Lead evalúa: ¿Cumple estándares? ¿Es mantenible? ¿Facilita team growth?
  2. Backend evalúa: ¿Es escalable? ¿Rendimiento adecuado? ¿Maneja carga esperada?
  3. Frontend evalúa: ¿Es usable? ¿Accesible? ¿Rendimiento en cliente aceptable?
  4. Architect evalúa: ¿Encaja en visión a largo plazo? ¿Acoplamiento apropiado?
  5. Se identifican preocupaciones técnicas y oportunidades de mejora
  6. Se genera consenso técnico o se documentan desacuerdos para decisión de liderazgo
```

## Salida del Comando

- **Perspectiva Tech Lead**: Calidad de código, estándares, testabilidad, mantenibilidad
- **Perspectiva Backend**: APIs, bases de datos, rendimiento, escalabilidad, seguridad de servidor
- **Perspectiva Frontend**: UI/UX, rendimiento de navegador, accesibilidad, compatibilidad
- **Perspectiva Architect**: Decisiones estructurales, patrones, acoplamiento, evolución tecnológica
- **Preocupaciones Técnicas**: Issues identificados por cualquiera de las perspectivas
- **Oportunidades de Mejora**: Sugerencias para mejorar la propuesta técnica
- **Consenso Técnico**: Áreas donde todas las perspectivas coinciden
- **Desacuerdos**: Puntos que requieren decisión de liderazgo técnico

## Uso

```
/gd:tech-panel [decision técnica o enfoque arquitectónico a evaluar]
```

## Alias
- `/gd:mesa-tecnica`

## Parámetros Opcionales

- `--roles=lista`: Especificar roles adicionales a incluir (devops, security, data, etc.)
- `--escopo=alcance`: Limitar evaluación a aspectos específicos (performance, security, etc.)
- `--formato=salida`: Formato del reporte técnico (markdown, json, texto)

## Ejemplo

```
/gd:tech-panel Elegir entre microservicios y monolito para nuevo módulo de facturación
```

## Siguiente Paso
Usar los insights del panel técnico para informar decisiones de diseño con `/gd:plan` o identificar necesidad de prototipos con `/gd:poc`.