-- ============================================================================
-- One-time migration: Spanish adm_* schema -> English table/column names
-- Run after previous DDL (adm_contratos, adm_usuarios, adm_responsables, …).
-- Safe to re-run: skips steps when target English objects already exist.
-- ============================================================================

-- --- contracts (from adm_contratos)
DO $$
BEGIN
  IF to_regclass('sigat.adm_contratos') IS NOT NULL AND to_regclass('sigat.contracts') IS NULL THEN
    DROP TRIGGER IF EXISTS trg_adm_contratos_updated_at ON sigat.adm_contratos;
    DROP TRIGGER IF EXISTS trg_adm_contratos_validate_master ON sigat.adm_contratos;
    DROP FUNCTION IF EXISTS sigat.adm_contratos_touch_updated_at();
    DROP FUNCTION IF EXISTS sigat.adm_contratos_validate_master();

    ALTER TABLE sigat.adm_contratos RENAME COLUMN numero_contrato TO contract_number;
    ALTER TABLE sigat.adm_contratos RENAME COLUMN objeto_contractual TO contract_object;
    ALTER TABLE sigat.adm_contratos RENAME COLUMN fecha_inicio TO effective_start_date;
    ALTER TABLE sigat.adm_contratos RENAME COLUMN fecha_final TO effective_end_date;
    ALTER TABLE sigat.adm_contratos RENAME COLUMN datos_complementarios TO extra_attributes;
    ALTER TABLE sigat.adm_contratos RENAME COLUMN reglas_jsonlogic TO validation_jsonlogic;

    ALTER TABLE sigat.adm_contratos RENAME CONSTRAINT adm_contratos_fechas_chk TO contracts_dates_chk;
    ALTER TABLE sigat.adm_contratos RENAME CONSTRAINT adm_contratos_master_fk TO contracts_master_fk;

    ALTER TABLE sigat.adm_contratos RENAME TO contracts;

    ALTER INDEX IF EXISTS sigat.adm_contratos_tenant_numero_uidx RENAME TO contracts_tenant_contract_number_uidx;
    ALTER INDEX IF EXISTS sigat.adm_contratos_tenant_master_idx RENAME TO contracts_tenant_master_idx;
    ALTER INDEX IF EXISTS sigat.adm_contratos_vigencia_idx RENAME TO contracts_effective_dates_idx;
  END IF;
END $$;

-- Recreate contracts triggers when contracts table exists
DO $$
BEGIN
  IF to_regclass('sigat.contracts') IS NOT NULL THEN
    CREATE OR REPLACE FUNCTION sigat.contracts_validate_master()
    RETURNS trigger LANGUAGE plpgsql AS $f$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM sigat.masters m
        WHERE m.id = NEW.master_id AND m.tenant_id = NEW.tenant_id AND m.type = 'UND_ORGANIZACIONAL'
      ) THEN
        RAISE EXCEPTION 'contracts: master_id must reference sigat.masters for same tenant_id with type = UND_ORGANIZACIONAL';
      END IF;
      RETURN NEW;
    END;
    $f$;

    DROP TRIGGER IF EXISTS trg_contracts_validate_master ON sigat.contracts;
    CREATE TRIGGER trg_contracts_validate_master
      BEFORE INSERT OR UPDATE OF tenant_id, master_id ON sigat.contracts
      FOR EACH ROW EXECUTE PROCEDURE sigat.contracts_validate_master();

    CREATE OR REPLACE FUNCTION sigat.contracts_touch_updated_at()
    RETURNS trigger LANGUAGE plpgsql AS $g$
    BEGIN NEW.updated_at := now(); RETURN NEW; END;
    $g$;

    DROP TRIGGER IF EXISTS trg_contracts_updated_at ON sigat.contracts;
    CREATE TRIGGER trg_contracts_updated_at
      BEFORE UPDATE ON sigat.contracts
      FOR EACH ROW EXECUTE PROCEDURE sigat.contracts_touch_updated_at();
  END IF;
END $$;

-- --- users (canonical auth) + responsible_persons + responsible_person_unit_roles
DO $$
BEGIN
  IF to_regclass('sigat.adm_responsable_direccion') IS NOT NULL
     AND to_regclass('sigat.responsible_person_unit_roles') IS NULL THEN
    DROP TRIGGER IF EXISTS trg_adm_resp_dir_validate ON sigat.adm_responsable_direccion;
    DROP FUNCTION IF EXISTS sigat.adm_resp_dir_validate();
  END IF;

  IF to_regclass('sigat.adm_responsables') IS NOT NULL
     AND to_regclass('sigat.responsible_persons') IS NULL THEN
    DROP TRIGGER IF EXISTS trg_adm_responsables_delete_usuario ON sigat.adm_responsables;
    DROP TRIGGER IF EXISTS trg_adm_responsables_updated ON sigat.adm_responsables;
    DROP TRIGGER IF EXISTS trg_adm_responsables_validate ON sigat.adm_responsables;
    DROP FUNCTION IF EXISTS sigat.adm_responsables_delete_usuario();
    DROP FUNCTION IF EXISTS sigat.adm_responsables_validate_masters();
  END IF;

  IF to_regclass('sigat.adm_usuarios') IS NOT NULL AND to_regclass('sigat.app_users') IS NULL THEN
    DROP TRIGGER IF EXISTS trg_adm_usuarios_updated ON sigat.adm_usuarios;
  END IF;

  -- Master type literals (after triggers dropped so old checks do not run)
  UPDATE sigat.masters SET type = 'RESP_POSITION_TYPE' WHERE type = 'RESP_TIPO_CARGO';
  UPDATE sigat.masters SET type = 'RESP_EMPLOYMENT_TYPE' WHERE type = 'RESP_TIPO_CONTRATO';
  UPDATE sigat.masters SET type = 'RESP_UNIT_ROLE' WHERE type = 'RESP_ROL_EN_DIRECCION';

  -- Legacy adm_usuarios: align with sigat.users (do not introduce app_users if users already exists).
  IF to_regclass('sigat.adm_usuarios') IS NOT NULL AND to_regclass('sigat.app_users') IS NULL
     AND to_regclass('sigat.users') IS NULL THEN
    ALTER TABLE sigat.adm_usuarios RENAME COLUMN correo TO email;
    ALTER TABLE sigat.adm_usuarios ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'sigat' AND table_name = 'adm_usuarios' AND column_name = 'estado'
    ) THEN
      UPDATE sigat.adm_usuarios SET is_active = CASE upper(trim(estado::text))
        WHEN 'ACTIVO' THEN true WHEN 'ACTIVE' THEN true WHEN 'INACTIVO' THEN false WHEN 'INACTIVE' THEN false ELSE is_active END;
      ALTER TABLE sigat.adm_usuarios DROP COLUMN estado;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'sigat' AND table_name = 'adm_usuarios' AND column_name = 'password_hash'
    ) THEN
      ALTER TABLE sigat.adm_usuarios ADD COLUMN password_hash varchar NOT NULL DEFAULT '';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'sigat' AND table_name = 'adm_usuarios' AND column_name = 'role_id'
    ) THEN
      ALTER TABLE sigat.adm_usuarios ADD COLUMN role_id uuid;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'sigat' AND table_name = 'adm_usuarios' AND column_name = 'created_at'
    ) THEN
      ALTER TABLE sigat.adm_usuarios ADD COLUMN created_at timestamp DEFAULT now();
    END IF;
    ALTER TABLE sigat.adm_usuarios RENAME TO users;
    ALTER INDEX IF EXISTS sigat.adm_usuarios_correo_uidx RENAME TO users_email_key;
    ALTER INDEX IF EXISTS sigat.adm_usuarios_tenant_idx RENAME TO users_tenant_idx;
  ELSIF to_regclass('sigat.adm_usuarios') IS NOT NULL AND to_regclass('sigat.users') IS NOT NULL THEN
    RAISE NOTICE 'migrate_sigat_adm_schema_to_english: adm_usuarios and sigat.users both exist; merge or drop adm_usuarios manually, then point responsible_persons.user_id at users';
  END IF;

  IF to_regclass('sigat.adm_responsables') IS NOT NULL AND to_regclass('sigat.responsible_persons') IS NULL THEN
    ALTER TABLE sigat.adm_responsables RENAME COLUMN usuario_id TO user_id;
    ALTER TABLE sigat.adm_responsables RENAME COLUMN documento TO document_number;
    ALTER TABLE sigat.adm_responsables RENAME COLUMN nombre TO full_name;
    ALTER TABLE sigat.adm_responsables RENAME COLUMN correo TO contact_email;
    ALTER TABLE sigat.adm_responsables RENAME COLUMN celular TO mobile_phone;
    ALTER TABLE sigat.adm_responsables RENAME COLUMN estado TO status;
    UPDATE sigat.adm_responsables SET status = CASE upper(trim(status))
      WHEN 'ACTIVO' THEN 'ACTIVE' WHEN 'INACTIVO' THEN 'INACTIVE' WHEN 'SUSPENDIDO' THEN 'SUSPENDED' ELSE status END;
    ALTER TABLE sigat.adm_responsables RENAME COLUMN id_tipo_cargo TO position_type_master_id;
    ALTER TABLE sigat.adm_responsables RENAME COLUMN id_tipo_contrato TO employment_type_master_id;
    ALTER TABLE sigat.adm_responsables RENAME COLUMN fecha_contrato TO contract_date;
    ALTER TABLE sigat.adm_responsables RENAME TO responsible_persons;
    ALTER INDEX IF EXISTS sigat.adm_responsables_doc_uidx RENAME TO responsible_persons_doc_uidx;
    ALTER INDEX IF EXISTS sigat.adm_responsables_tenant_idx RENAME TO responsible_persons_tenant_idx;
    ALTER INDEX IF EXISTS sigat.adm_responsables_usuario_idx RENAME TO responsible_persons_user_idx;
    ALTER INDEX IF EXISTS sigat.adm_responsables_cargo_idx RENAME TO responsible_persons_position_type_idx;
    ALTER INDEX IF EXISTS sigat.adm_responsables_contrato_idx RENAME TO responsible_persons_employment_type_idx;
  END IF;

  IF to_regclass('sigat.adm_responsable_direccion') IS NOT NULL
     AND to_regclass('sigat.responsible_person_unit_roles') IS NULL THEN
    ALTER TABLE sigat.adm_responsable_direccion RENAME COLUMN responsable_id TO responsible_person_id;
    ALTER TABLE sigat.adm_responsable_direccion RENAME COLUMN id_rol_direccion TO unit_role_master_id;
    ALTER TABLE sigat.adm_responsable_direccion RENAME CONSTRAINT adm_resp_dir_uniq TO responsible_person_unit_roles_uniq;
    ALTER TABLE sigat.adm_responsable_direccion RENAME TO responsible_person_unit_roles;
    ALTER INDEX IF EXISTS sigat.adm_resp_dir_tenant_idx RENAME TO responsible_person_unit_roles_tenant_idx;
    ALTER INDEX IF EXISTS sigat.adm_resp_dir_master_idx RENAME TO responsible_person_unit_roles_master_idx;
  END IF;
END $$;

DROP FUNCTION IF EXISTS sigat.adm_touch_updated_at();

CREATE OR REPLACE FUNCTION sigat.responsible_persons_validate_masters()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM sigat.masters m
    WHERE m.id = NEW.position_type_master_id AND m.tenant_id = NEW.tenant_id AND m.type = 'RESP_POSITION_TYPE'
  ) THEN
    RAISE EXCEPTION 'responsible_persons: position_type_master_id must reference masters.type = RESP_POSITION_TYPE';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM sigat.masters m
    WHERE m.id = NEW.employment_type_master_id AND m.tenant_id = NEW.tenant_id AND m.type = 'RESP_EMPLOYMENT_TYPE'
  ) THEN
    RAISE EXCEPTION 'responsible_persons: employment_type_master_id must reference masters.type = RESP_EMPLOYMENT_TYPE';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM sigat.users u WHERE u.id = NEW.user_id AND u.tenant_id = NEW.tenant_id
  ) THEN
    RAISE EXCEPTION 'responsible_persons: user_id must exist in sigat.users with same tenant_id';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION sigat.responsible_person_unit_roles_validate()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE r_tenant uuid;
BEGIN
  SELECT r.tenant_id INTO r_tenant FROM sigat.responsible_persons r WHERE r.id = NEW.responsible_person_id;
  IF r_tenant IS NULL THEN
    RAISE EXCEPTION 'responsible_person_unit_roles: responsible_person_id not found';
  END IF;
  IF NEW.tenant_id IS DISTINCT FROM r_tenant THEN
    RAISE EXCEPTION 'responsible_person_unit_roles: tenant_id mismatch';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM sigat.masters m
    WHERE m.id = NEW.master_id AND m.tenant_id = NEW.tenant_id AND m.type = 'UND_ORGANIZACIONAL'
  ) THEN
    RAISE EXCEPTION 'responsible_person_unit_roles: master_id must be UND_ORGANIZACIONAL';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM sigat.masters m
    WHERE m.id = NEW.unit_role_master_id AND m.tenant_id = NEW.tenant_id AND m.type = 'RESP_UNIT_ROLE'
  ) THEN
    RAISE EXCEPTION 'responsible_person_unit_roles: unit_role_master_id must be RESP_UNIT_ROLE';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION sigat.sigat_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;

DO $t$
BEGIN
  IF to_regclass('sigat.responsible_person_unit_roles') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_responsible_person_unit_roles_validate ON sigat.responsible_person_unit_roles;
    CREATE TRIGGER trg_responsible_person_unit_roles_validate
      BEFORE INSERT OR UPDATE OF tenant_id, responsible_person_id, master_id, unit_role_master_id
      ON sigat.responsible_person_unit_roles
      FOR EACH ROW EXECUTE PROCEDURE sigat.responsible_person_unit_roles_validate();
  END IF;
  IF to_regclass('sigat.responsible_persons') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_responsible_persons_validate ON sigat.responsible_persons;
    CREATE TRIGGER trg_responsible_persons_validate
      BEFORE INSERT OR UPDATE OF tenant_id, user_id, position_type_master_id, employment_type_master_id
      ON sigat.responsible_persons
      FOR EACH ROW EXECUTE PROCEDURE sigat.responsible_persons_validate_masters();
    DROP TRIGGER IF EXISTS trg_responsible_persons_updated ON sigat.responsible_persons;
    CREATE TRIGGER trg_responsible_persons_updated
      BEFORE UPDATE ON sigat.responsible_persons
      FOR EACH ROW EXECUTE PROCEDURE sigat.sigat_touch_updated_at();
  END IF;
END $t$;
