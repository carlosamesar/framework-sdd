# SAGA pattern core

## Principios
- orquestación central en sdd-orchestrator
- pasos idempotentes
- compensación definida para fallos
- logs con correlationId y evidencia

## Regla
- ningún agente ejecuta tareas fuera del SDD válido
- validar entrada y salida en cada límite del flujo
