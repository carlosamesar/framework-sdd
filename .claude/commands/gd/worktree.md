# /gd:worktree — Organizar Trabajo Paralelo con Ramas fix/** y PR Trazable

## Propósito
Permitir que varias iniciativas avancen en paralelo con aislamiento limpio de ramas, cambios y validaciones. En este framework, el aislamiento Git no es opcional: cada solución debe vivir en su propia rama `fix/**` y cerrar con PR a la rama base correspondiente.

---

## Cuándo usarlo

- varios fixes o features al mismo tiempo;
- necesidad de separar frontend y backend por repo;
- hotfixes o correcciones urgentes que no deben contaminar la base principal.

---

## Política obligatoria de ramas

- un objetivo = una rama `fix/<slug>`;
- cada rama nace desde la rama base correcta del repo afectado;
- frontend y backend pueden requerir ramas separadas en repos distintos;
- el resultado final debe terminar en PR hacia la rama origen correspondiente.

### Ejemplos válidos

- `fix/terceros-formulario`
- `fix/sedes-endpoint-cors`
- `fix/performance-grid-proveedores`

---

## Flujo recomendado

```text
1. identificar repo objetivo
2. identificar rama base
3. crear rama fix/<slug>
4. abrir worktree si hace falta aislamiento físico
5. implementar, validar y cerrar el cambio
6. abrir PR a la rama base correspondiente
```

---

## Criterios de calidad

- aislamiento limpio por repo y objetivo;
- naming consistente bajo `fix/**`;
- trazabilidad total entre change, rama y PR;
- continuidad clara con `/gd:start → /gd:review → /gd:close`.

## Anti-patrones a evitar

- implementar sobre ramas base o protegidas;
- usar nombres genéricos sin trazabilidad;
- mezclar frontend y backend no relacionados en la misma rama;
- cerrar el trabajo sin PR listo para revisión.

## Siguiente paso

Combinar con `/gd:start`, `/gd:implement`, `/gd:review` y `/gd:close` según el momento del flujo.