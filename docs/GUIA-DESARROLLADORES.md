# Guía para Desarrolladores — Framework SDD + Comandos `/gd:*`

**Versión**: 1.0 | **Fecha**: 2026-04-15  
**Para**: Desarrolladores del equipo Good4D que trabajan con el framework Don Carlo

> Esta guía tiene ejemplos reales, no abstractos. Cada flujo muestra qué comando ejecutar, qué produce, y cómo continuar.

---

## Índice Rápido

1. [Quiero implementar una feature nueva](#1-feature-nueva)
2. [Quiero hacer un cambio pequeño](#2-cambio-pequeño)
3. [Quiero crear una Lambda CRUD completa](#3-lambda-crud)
4. [Quiero crear un módulo NestJS](#4-modulo-nestjs)
5. [Quiero crear una feature Angular](#5-feature-angular)
6. [Quiero entender dónde estoy (sesión interrumpida)](#6-retomar-sesion)
7. [Quiero validar que mi SPEC está bien antes de implementar](#7-validar-spec)
8. [Quiero diagnosticar por qué algo falla](#8-diagnostico)
9. [Quiero archivar un change completado](#9-archivar)
10. [Referencia de comandos por situación](#10-referencia-rapida)

---

## 1. Feature Nueva

**Situación**: El PM te asigna una historia de usuario. No sabes por dónde empezar.

### Paso a paso

```bash
# 1. Arranca. El framework detecta el stack y la complejidad.
/gd:start "crear módulo de gestión de proveedores con CRUD y multi-tenant"
```

**Lo que produce:**
```
Stack detectado: backend
Nivel de complejidad: 2 — Standard
Fases: specify → clarify → plan → breakdown → implement → review → verify → archive
Proyecto: develop/backend/gooderp-orchestation
Referencia: lib/lambda/transacciones/fnTipoDescuento/

→ Iniciando con /gd:specify...
```

```bash
# 2. Especificar — convierte la idea en SPEC Gherkin
/gd:specify "CRUD de proveedores con tenant_id desde JWT"
```

**Lo que produce:** `openspec/changes/gestion-proveedores/spec.md` con escenarios como:
```gherkin
Escenario: Crear proveedor
  Dado un usuario autenticado con tenant_id válido en JWT
  Cuando POST /proveedores con { nombre: "Acme", ruc: "1234567890001" }
  Entonces retorna 201 con el proveedor creado
  Y el proveedor tiene tenant_id del JWT, no del body
```

```bash
# 3. Clarificar — detecta ambigüedades antes de planificar
/gd:clarify

# Ejemplo de lo que detecta:
# ⚠️ ¿Soft delete o hard delete para proveedores?
# ⚠️ ¿Un proveedor puede existir en múltiples tenants?
# ⚠️ ¿Qué campos son únicos (ruc) a nivel de tenant o global?
```

```bash
# 4. Planificar — decide la arquitectura
/gd:plan

# Produce: openspec/changes/gestion-proveedores/plan.md
# Decide: Lambda (fnProveedor) vs NestJS (servicio-contabilidad)
# Incluye: diagrama, contratos API, modelo de datos
```

```bash
# 5. Desglosar — lista ordenada de tareas
/gd:breakdown

# Produce: openspec/changes/gestion-proveedores/tasks.md
# Orden: test primero (TDD), luego implementación
# Ejemplo:
# [ ] T1: Crear test handlers/create.test.mjs (RED)
# [ ] T2: Implementar handlers/create.mjs (GREEN)
# [ ] T3: Crear test handlers/list.test.mjs (RED)
# [ ] T4: Implementar handlers/list.mjs (GREEN)
# ...
```

```bash
# 6. Implementar
/gd:implement

# El agente sigue el orden del breakdown
# Escribe el test ANTES del código (TDD obligatorio)
# Usa los templates reales de fnTipoDescuento como base
```

```bash
# 7. Verificar
/gd:verify

# Verifica: tests pasan, coverage ≥ 85%, multi-tenant OK, CORS OK
```

```bash
# 8. Archivar
/gd:archive

# Sincroniza spec final, actualiza project.md y registry.md
# Mueve change a openspec/changes/archive/
```

---

## 2. Cambio Pequeño

**Situación**: Necesitas agregar un campo, corregir un bug simple, o cambiar un mensaje de error.

```bash
# Modo rápido — sin fases SDD, directo a implementar
/gd:rapido "agregar campo 'telefono' a tabla de proveedores en fnProveedor"
```

**Cuándo usar `/gd:rapido`:**
- 1-3 archivos afectados
- Sin impacto en arquitectura o esquema complejo
- Sin cambios en contratos de API
- Estimado < 30 minutos

**Cuándo NO usar `/gd:rapido`:**
- Cambios en multi-tenant logic → usar `/gd:start`
- Nuevos endpoints → usar `/gd:start`
- Cambios de esquema PostgreSQL → usar `/gd:start`

---

## 3. Lambda CRUD

**Situación**: Necesitas crear una Lambda nueva con endpoints REST (GET/POST/PUT/DELETE).

```bash
# Activar contexto especializado de backend directamente
/gd:start-backend "crear lambda fnCategoria para gestión de categorías de productos"

# O equivalente:
/gd:start --stack=backend "crear lambda fnCategoria para gestión de categorías"
```

**El comando `start-backend` provee automáticamente:**

### Estructura que se generará

```
lib/lambda/productos/fnCategoria/
├── index.mjs              ← Router (OPTIONS primero, luego routing)
├── lambda.config.json     ← Config AWS con memoria, timeout, tags
├── package.json
├── handlers/
│   ├── create.mjs         ← POST /categorias
│   ├── list.mjs           ← GET /categorias
│   ├── getById.mjs        ← GET /categorias/:id
│   ├── update.mjs         ← PUT /categorias/:id
│   ├── delete.mjs         ← DELETE /categorias/:id (soft)
│   ├── create.test.mjs    ← Test TDD (se escribe PRIMERO)
│   ├── list.test.mjs
│   └── ...
└── utils/
    ├── database.mjs       ← Pool PostgreSQL singleton
    ├── responseBuilder.mjs ← CORS headers + request_id
    └── sanitization.mjs   ← extractTenantId (JWT only)
```

### Reglas que el agente respeta automáticamente

| Regla | Cómo se aplica |
|-------|----------------|
| `tenant_id` desde JWT | `extractTenantId(event)` en utils/sanitization.mjs |
| OPTIONS primero | Primera instrucción del handler en index.mjs |
| Soft delete | `DELETE` marca `eliminado_por`, no hace `DELETE FROM` |
| Errores PG | 23505 → 409, 23503 → 400, 23514 → 400 |
| request_id | Todo response incluye UUID generado por ResponseBuilder |
| TDD | Test escrito antes del handler (RED → GREEN) |

### Verificación CORS después de deploy

```bash
# Verificar que OPTIONS responde correctamente
curl -X OPTIONS https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/categorias \
  -H "Origin: https://app.example.com" \
  -H "Access-Control-Request-Method: POST" \
  -v 2>&1 | grep -E "(< HTTP|access-control|Allow)"

# Esperado:
# < HTTP/2 200
# < access-control-allow-origin: *
# < access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS
# < access-control-allow-headers: Content-Type, Authorization, X-Api-Key, Idempotency-Key
```

---

## 4. Módulo NestJS

**Situación**: El dominio es complejo (múltiples relaciones, transacciones, reglas de negocio) y una Lambda no alcanza.

```bash
/gd:start-backend "crear módulo de órdenes de compra en servicio-contabilidad con estados y líneas"
```

**El agente decide Lambda vs NestJS** basado en:
- ¿Múltiples entidades relacionadas? → NestJS
- ¿Transacciones BD complejas? → NestJS
- ¿Dominio aislado, CRUD simple? → Lambda

### Estructura NestJS generada

```typescript
// Estructura del módulo
src/
└── ordenes-compra/
    ├── ordenes-compra.module.ts
    ├── controllers/
    │   └── ordenes-compra.controller.ts
    ├── services/
    │   └── ordenes-compra.service.ts
    ├── entities/
    │   ├── orden-compra.entity.ts
    │   └── linea-orden.entity.ts
    ├── dtos/
    │   ├── crear-orden.dto.ts
    │   └── actualizar-orden.dto.ts
    └── guards/                         ← solo si el módulo tiene guards propios
```

### Patrón obligatorio en el controller

```typescript
@Controller('ordenes-compra')
@UseGuards(JwtTenantGuard)              // ← Guard global, no en cada endpoint
@ApiTags('ordenes-compra')
export class OrdenesCmpraController {

  @Post()
  async crear(
    @TenantId() tenantId: string,       // ← NUNCA de body
    @UserId() userId: string,           // ← Para auditoría createdBy
    @Body() dto: CrearOrdenDto,
  ) {
    return this.service.crear(tenantId, userId, dto);
  }
}
```

### Errores PostgreSQL mapeados

```typescript
// En el service — manejo estándar de errores PG
} catch (error) {
  if (error.code === '23505') throw new ConflictException('Ya existe una orden con ese número');
  if (error.code === '23503') throw new BadRequestException('Referencia inválida');
  throw new InternalServerErrorException('Error al crear la orden');
}
```

---

## 5. Feature Angular

**Situación**: Necesitas construir una pantalla nueva con tabla, formulario y navegación.

```bash
/gd:start-frontend "pantalla de gestión de categorías de productos con tabla filtrable y formulario de creación"

# O equivalente:
/gd:start --stack=frontend "pantalla de categorías con tabla y formulario"
```

**El comando `start-frontend` provee:**

### Estructura generada

```
src/app/features/categorias/
├── components/
│   ├── smart/
│   │   └── categorias/
│   │       ├── categorias.component.ts   ← inject(Facade), signals, ngOnInit
│   │       └── categorias.component.html
│   └── dumb/
│       ├── categorias-lista/
│       │   └── categorias-lista.component.ts   ← @Input/@Output, OnPush
│       └── categoria-form/
│           └── categoria-form.component.ts
├── models/
│   ├── dtos/
│   │   ├── categoria.dto.ts
│   │   └── crear-categoria.dto.ts
│   └── enums/
│       └── estado-categoria.enum.ts
└── services/
    ├── api/
    │   └── categorias-api.service.ts    ← HttpClient
    └── facades/
        └── categorias-facade.service.ts ← signals + firstValueFrom
```

### Patrón Smart/Dumb con Signals (obligatorio)

```typescript
// FACADE — orchesta signals y llamadas API
@Injectable({ providedIn: 'root' })
export class CategoriasFacadeService {
  private readonly api = inject(CategoriasApiService);

  // Señales privadas (escritura)
  private readonly _categorias = signal<CategoriaDTO[]>([]);
  private readonly _cargando = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // Señales públicas (solo lectura)
  readonly categorias = this._categorias.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();
  readonly total = computed(() => this._categorias().length);

  async cargarCategorias(): Promise<void> {
    this._cargando.set(true);
    this._error.set(null);
    try {
      const data = await firstValueFrom(this.api.listar());
      this._categorias.set(data);
    } catch (e: any) {
      this._error.set(e?.error?.message || 'Error al cargar categorías');
    } finally {
      this._cargando.set(false);
    }
  }
}

// SMART COMPONENT — consume facade, delega render a dumb
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
export class CategoriasComponent implements OnInit {
  private readonly facade = inject(CategoriasFacadeService);

  categorias = this.facade.categorias;   // signal readonly
  cargando = this.facade.cargando;
  error = this.facade.error;

  ngOnInit() { this.facade.cargarCategorias(); }
}

// DUMB COMPONENT — solo recibe @Input y emite @Output
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriasListaComponent {
  @Input() categorias: CategoriaDTO[] = [];
  @Input() errorMensaje: string | null = null;
  @Output() editar = new EventEmitter<CategoriaDTO>();
  @Output() eliminar = new EventEmitter<CategoriaDTO>();
}
```

### Tests E2E con Playwright

```typescript
// e2e/tests/categorias/categorias.spec.ts
import { test, expect } from '../../fixtures/e2e';

test.describe('Categorías — Tests E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/categorias');
    // La fixture e2e carga storageState con JWT automáticamente
    await expect(page.locator('[data-testid="tabla-categorias"]'))
      .toBeVisible({ timeout: 10_000 });
  });

  test('Muestra lista de categorías', async ({ page }) => {
    await expect(page.locator('[data-testid="tabla-categorias"] tbody tr'))
      .toHaveCount(await page.locator('tbody tr').count());
    await page.screenshot({ path: 'test-results/categorias-lista.png' });
  });

  test('Crea una categoría nueva', async ({ page }) => {
    await page.locator('[data-testid="btn-nueva-categoria"]').click();
    await page.locator('[data-testid="input-nombre"]').fill('Electrónica');
    await page.locator('[data-testid="btn-guardar"]').click();

    await expect(page.locator('.swal2-popup, [data-testid="notificacion-exito"]'))
      .toBeVisible({ timeout: 5_000 });
  });

  test('Muestra error cuando el API falla', async ({ page }) => {
    await page.route('**/api/categorias', route =>
      route.fulfill({ status: 500, body: JSON.stringify({ message: 'Error servidor' }) })
    );
    await page.goto('/categorias');
    await expect(page.locator('[data-testid="mensaje-error"]')).toBeVisible();
  });
});
```

---

## 6. Retomar Sesión

**Situación**: Estabas trabajando ayer, el contexto se perdió, no sabes en qué fase estabas.

```bash
# Opción 1: Ver estado del proyecto
/gd:status

# Muestra:
# Change activo: gestion-proveedores
# Fase actual: implement (T3/8 completadas)
# Último commit: hace 2 horas
# Tests: 5 pasando, 3 pendientes
```

```bash
# Opción 2: Recuperar sesión completa con contexto
/gd:continue

# Carga: memoria Engram, specs activas, último estado de tareas
# Ideal si hay múltiples changes activos
```

```bash
# Opción 3: Buscar decisión específica del pasado
/gd:recall "decisión lambda vs nestjs proveedores"

# Busca en memoria Engram la decisión, muestra razones y contexto
```

---

## 7. Validar SPEC

**Situación**: Escribiste un SPEC y quieres asegurarte que está bien antes de que el equipo lo revise o antes de planificar.

```bash
/gd:validar-spec openspec/changes/gestion-proveedores/spec.md
```

**Ejemplo de output:**

```
Puntuación: 73/100 — ACEPTABLE (umbral mínimo: 80)

Dimensión            Puntaje   Problemas
──────────────────────────────────────────────────────────
Estructura (20%)     18/20     OK
Verificabilidad (25%) 15/25   ⚠ 3 escenarios sin criterio numérico
Completitud (25%)    18/25    ⚠ Falta escenario: proveedor sin tenant
Claridad (15%)       12/15    ⚠ Ambigüedad en "activo"
Consistencia (10%)   10/10    OK

Acciones recomendadas:
1. Agregar: Escenario "Intento de crear proveedor sin JWT válido → 401"
2. Precisar: "activo" → usar enum EstadoProveedor.ACTIVO
3. Agregar criterio: "tiempo de respuesta < 500ms bajo carga normal"
```

```bash
# Versión con puntuación rápida (solo número)
/gd:spec-score openspec/changes/gestion-proveedores/spec.md
```

---

## 8. Diagnóstico

**Situación**: Algo no funciona como debería. Quieres entender el problema antes de tocar código.

```bash
# Diagnóstico de salud general del proyecto
/gd:doctor

# Verifica: tests, lint, build, coverage, specs activas, drift specs vs código
```

```bash
# Causa raíz de un bug específico
/gd:razonar:5-porques "la Lambda fnProveedor retorna 500 al crear con tenant válido"

# Produce análisis:
# ¿Por qué? → Error en database.mjs
# ¿Por qué? → Pool no inicializado al cold start
# ¿Por qué? → Singleton no maneja reconexión después de timeout
# ¿Por qué? → ...
# ¿Raíz? → Falta pg.Pool keepAlive y idleTimeoutMillis
```

```bash
# Si estás en un loop (el agente hace lo mismo varias veces)
/gd:doom-shield

# Detecta el patrón y sugiere salida
```

```bash
# Drift entre spec y código (spec dice X, código hace Y)
/gd:drift openspec/changes/gestion-proveedores/spec.md
```

---

## 9. Archivar

**Situación**: Terminaste de implementar y verificar. Hay que cerrar el change.

```bash
/gd:archive

# Ejecuta:
# 1. Verifica todos los quality gates (tests, coverage, lint)
# 2. Sincroniza spec delta → spec principal
# 3. Actualiza openspec/project.md
# 4. Mueve change a openspec/changes/archive/<fecha>-<nombre>/
# 5. Guarda evidencia de implementación
```

**Gates obligatorios antes de archivar:**

| Gate | Criterio |
|------|---------|
| Tests | 100% passing |
| Coverage | ≥ 85% (backend) / ≥ 75% (frontend) |
| Lint | 0 errores |
| Build | 0 errores TypeScript |
| Multi-tenant | Test con JWT válido + inválido |
| CORS | OPTIONS retorna 200 con headers correctos |

---

## 10. Referencia Rápida

### Por situación

| Situación | Comando |
|-----------|---------|
| Empezar feature | `/gd:start "descripción"` |
| Feature Angular | `/gd:start --stack=frontend "..."` o `/gd:start-frontend "..."` |
| Feature Lambda/NestJS | `/gd:start --stack=backend "..."` o `/gd:start-backend "..."` |
| Cambio pequeño (1-3 archivos) | `/gd:rapido "descripción"` |
| Proyecto grande (1-2 semanas) | `/gd:completo "descripción"` |
| Validar SPEC antes de planificar | `/gd:validar-spec <path>` |
| Ver estado del proyecto | `/gd:status` |
| Retomar sesión interrumpida | `/gd:continue` |
| Buscar decisión pasada | `/gd:recall "búsqueda"` |
| Diagnóstico de salud | `/gd:doctor` |
| Causa raíz de bug | `/gd:razonar:5-porques "problema"` |
| Cerrar change completado | `/gd:archive` |

### Flujo SDD completo

```
/gd:start
    └── /gd:specify       → openspec/changes/<nombre>/spec.md
        └── /gd:clarify   → detecta ambigüedades
            └── /gd:plan  → blueprint técnico
                └── /gd:breakdown → lista de tareas ordenadas
                    └── /gd:implement → TDD: RED → GREEN → REFACTOR
                        └── /gd:review → peer review 7 dimensiones
                            └── /gd:verify → gates: tests, coverage, lint
                                └── /gd:archive → sincronizar + cerrar
```

### Flujo rápido (Nivel 0-1)

```
/gd:rapido → /gd:implement → /gd:verify → done
```

### Decisión Lambda vs NestJS

| Pregunta | Lambda | NestJS |
|----------|--------|--------|
| ¿Entidades relacionadas? | 1-2 | 3+ → NestJS |
| ¿Transacciones BD? | Simples | Complejas → NestJS |
| ¿Reglas de negocio? | Pocas | Muchas → NestJS |
| ¿Tiempo de desarrollo? | 1-2 días | 3-5 días |
| ¿Escala independiente? | Sí | No |
| ¿Ejemplo real del proyecto? | `fnTipoDescuento` | `servicio-tesoreria` |

---

## Referencias del Codebase

| Patrón | Archivo real |
|--------|-------------|
| Lambda CRUD completo | `develop/backend/gooderp-orchestation/lib/lambda/transacciones/fnTipoDescuento/` |
| NestJS module completo | `develop/backend/gooderp-orchestation/servicio-tesoreria/src/tesoreria/` |
| JwtTenantGuard | `develop/backend/gooderp-orchestation/servicio-tesoreria/src/common/guards/jwt-tenant.guard.ts` |
| Angular Smart component | `develop/frontend/gooderp-client/src/app/features/parqueaderos/components/smart/` |
| Angular Facade con signals | `develop/frontend/gooderp-client/src/app/features/parqueaderos/services/facades/` |
| Playwright E2E tests | `develop/frontend/gooderp-client/e2e/tests/` |

---

*Generado por Framework-SDD v3.0 | Documentación mantenida en `docs/`*
