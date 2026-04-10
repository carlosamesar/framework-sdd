# Delta for Database: public.estados

## MODIFIED Requirements

### Requirement: PK `id_estado` SHALL be UUID

La columna `id_estado` de la tabla `public.estados` MUST ser de tipo `UUID` y SHALL NOT usar una secuencia entera.

#### Scenario: Cambio de tipo en `public.estados`
- GIVEN la tabla `public.estados` con `id_estado` como `integer`
- WHEN se ejecuta el script de migración
- THEN la columna `id_estado` MUST ser de tipo `uuid`
- AND el valor anterior `1` MUST mapearse a un nuevo `UUID` único

### Requirement: FK `id_estado` SHALL be UUID in referencing tables

Todas las columnas `id_estado` en las 27 tablas que referencian `public.estados` MUST ser convertidas a tipo `UUID`.

#### Scenario: Integridad referencial post-migración
- GIVEN un registro en `public.bancos` con `id_estado = 1`
- WHEN se completa la migración a UUID
- THEN el registro en `public.bancos` MUST tener el nuevo `UUID` correspondiente al estado `Activo`
- AND la FK MUST ser válida y apuntar a la nueva PK en `public.estados`

### Requirement: Default value SHALL be UUID

El valor por defecto para `id_estado` en las tablas maestras SHOULD ser el UUID correspondiente al estado 'ACTIVO'.

#### Scenario: Inserción de nuevo registro sin estado
- GIVEN una tabla con `id_estado` UUID y default configurado
- WHEN se inserta un registro sin especificar `id_estado`
- THEN el registro MUST crearse con el UUID del estado 'ACTIVO'

## ADDED Requirements

### Requirement: Mapping consistency

Se MUST mantener un mapeo consistente entre los IDs enteros antiguos y los nuevos UUIDs durante la migración para garantizar que no se pierda la relación de los datos existentes.

#### Scenario: Verificación de mapeo
- GIVEN un estado con `id_estado = 2` (INACTIVO)
- WHEN se genera su nuevo UUID
- THEN todos los registros en tablas dependientes que tenían `2` MUST ahora tener ese mismo UUID generado
