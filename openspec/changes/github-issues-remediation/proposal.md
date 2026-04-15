# Propuesta — github-issues-remediation

## Objetivo

Remediar la automatización basada en GitHub Issues para que el flujo SDD pueda operar con seguridad, trazabilidad e integración real mediante eventos nativos de GitHub.

## Problemas detectados

- el flujo actual falla al listar o crear issues;
- no hay workflows activos para eventos de GitHub en el workspace evaluado;
- el runner actual depende de polling e idempotencia en memoria;
- faltan pruebas específicas del flujo crítico.

## Resultado esperado

Al finalizar este change, el sistema debe:

1. autenticar correctamente contra GitHub;
2. dispararse por workflow nativo ante eventos válidos;
3. evitar reprocesos y duplicados;
4. dejar evidencia verificable de cada ejecución.
