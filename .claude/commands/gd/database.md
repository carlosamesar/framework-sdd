# /gd:database — Especialista en Base de Datos Multi-Tenant

**Propósito:**
Orquesta el diseño, migración, validación y documentación de la base de datos para proyectos multi-tenant, alineado al contexto y convenciones del Framework-SDD. Automatiza análisis de esquemas, generación de migraciones, validación de constraints y recomendaciones de seguridad/escalabilidad.

---

## ¿Cuándo usar?
- Al iniciar un nuevo módulo o microservicio multi-tenant.
- Antes/después de cambios en el modelo de datos.
- Para validar integridad, performance y seguridad de la BD.

---

## Funcionamiento
1. Analiza el contexto del proyecto y la BD actual (ORM, scripts, migraciones, conexiones, etc).
2. Sugiere o genera migraciones, constraints, índices y particiones multi-tenant.
3. Valida convenciones (nombres, claves, restricciones, tenant_id everywhere).
4. Recomienda mejoras de seguridad, performance y escalabilidad.
5. Documenta el modelo y cambios en memoria Engram.

## Regla severa para migraciones SQL

- Toda migración SQL debe ejecutarse mediante **Node.js** dentro de la solución.
- La conexión debe salir del archivo `.env` ya mapeado en el proyecto o del cargador equivalente del repo.
- No se debe asumir ejecución manual como flujo principal desde clientes externos o scripts sueltos fuera del repositorio.
- Si hace falta una migración, se debe dejar en script reproducible, versionable y auditable desde el proyecto.

---

## Ejemplo de uso
```
/gd:database --analyze
/gd:database --generate-migration "Agregar campo billing_cycle a tenant"
/gd:database --validate
```

---

## Integración
- Usar tras `/gd:specify` y antes de `/gd:implement` en el pipeline.
- Compatible con pipelines multi-tenant y microservicios.
- Documenta y sincroniza cambios en memoria Engram.

---

## Notas
- Focalizado en patrones multi-tenant (Postgres, MySQL, DynamoDB, etc).
- Puede integrarse con herramientas ORM (TypeORM, Sequelize, Prisma).
- Ideal para auditoría, migraciones y compliance.
