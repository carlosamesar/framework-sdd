# Tareas — github-issues-remediation

## P0 — Recuperar operatividad mínima

- [ ] Verificar owner, repo objetivo y permisos efectivos del token de GitHub
- [x] Añadir validación temprana de entorno para token, repo, owner y variables obligatorias
- [x] Implementar modo dry-run formal para pruebas seguras
- [x] Crear workflow de GitHub Actions para eventos de issues y ejecución manual
- [ ] Confirmar que el flujo puede listar issues abiertos en un repositorio válido
- [ ] Confirmar que el flujo puede crear un issue de prueba controlado

## P1 — Estabilización operativa

- [x] Persistir estado de issues procesados fuera de memoria
- [x] Evitar reprocesamiento del mismo issue salvo reintento explícito
- [x] Añadir manejo robusto de errores por permisos, red y rate limit
- [x] Crear smoke tests del flujo de ticketing y comentarios
- [ ] Crear pruebas de regresión para duplicados, input inválido y permisos faltantes
- [ ] Integrar estas pruebas en CI

## P1 — Seguridad y configuración

- [ ] Externalizar owner, repo, labels y ramas a configuración
- [x] Restringir disparo por labels, autor permitido o plantilla válida
- [ ] Registrar rechazos y motivos en logs auditables

## P2 — Productivización

- [x] Agregar logs estructurados por ejecución e issue
- [x] Generar evidencia de ejecución en reportes o knowledge base
- [ ] Medir duración, éxito, fallo y reintentos
- [x] Unificar implementaciones duplicadas del runner de issues
- [x] Documentar operación, soporte y rollback

## Verificación de cierre

- [x] Flujo end-to-end ejecutado con evidencia verificable
- [ ] Cero duplicados tras reinicio del proceso
- [ ] Cobertura del flujo crítico aceptable en CI
- [x] Documentación operativa publicada
