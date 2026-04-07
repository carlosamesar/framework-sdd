# EVIDENCE.md — Certificación de Implementación

## 1. Información del Cambio
- **Tarea**: [ID/Nombre]
- **Fecha**: [YYYY-MM-DD]
- **Autor**: [Agente/Usuario]

## 2. Pruebas Unitarias e Integración
- [ ] Tests pasan (RED -> GREEN -> REFACTOR)
- [ ] Cobertura >= 85%

## 3. Pruebas E2E (Playwright / Newman)
### Playwright (UI)
- [ ] Escenario [A] exitoso
- [ ] Escenario [B] exitoso

### Newman (API)
- [ ] Contrato [X] validado
- [ ] Status codes correctos

## 4. Evidencia de Ejecución (Logs/Screenshots)
```text
[Pegar logs de consola o capturas de pantalla]
```

## 5. Certificación
- [ ] No hay stubs (TODOs) pendientes.
- [ ] El código reside en `/develop`.
- [ ] OWASP Scan limpio.
