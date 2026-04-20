-- Tabla usada por apisGoodErp-fnAgendamiento (AgendamientoDatabase.list / create / …)
-- Ejecutar contra el mismo Postgres que define DB_HOST en .env (schema agendamiento).

CREATE SCHEMA IF NOT EXISTS agendamiento;

CREATE TABLE IF NOT EXISTS agendamiento.agenda_cita (
    id_agenda UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_tenant TEXT NOT NULL,
    id_sucursal TEXT NULL,
    id_tercero TEXT NOT NULL,
    id_empleado TEXT NOT NULL,
    fecha_inicio TIMESTAMPTZ NOT NULL,
    fecha_fin TIMESTAMPTZ NOT NULL,
    fecha_expiracion_reserva TIMESTAMPTZ NULL,
    estado VARCHAR(64) NOT NULL DEFAULT 'RESERVA_TENTATIVA',
    observaciones TEXT NULL,
    valor_total NUMERIC(18, 2) NOT NULL DEFAULT 0,
    esquema JSONB NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agenda_cita_tenant_fecha
    ON agendamiento.agenda_cita (id_tenant, fecha_inicio);

CREATE INDEX IF NOT EXISTS idx_agenda_cita_empleado
    ON agendamiento.agenda_cita (id_empleado, id_tenant);
