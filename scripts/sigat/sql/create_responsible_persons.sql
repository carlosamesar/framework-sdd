-- ============================================================================
-- SIGAT: responsible persons, login users, unit assignments (N:M + role)
-- ============================================================================
-- Masters (sigat.masters), per tenant:
--   RESP_POSITION_TYPE   (job position category)
--   RESP_EMPLOYMENT_TYPE (employment / legal link type)
--   RESP_UNIT_ROLE       (role within each organizational unit row)
-- Login: sigat.users (existing). One responsible_persons row references
-- exactly one users row via user_id (1:1 for “person with portal account”).
-- responsible_person_unit_roles: many UND_ORGANIZACIONAL masters + role per row.
-- ============================================================================

CREATE TABLE IF NOT EXISTS sigat.responsible_persons (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   uuid NOT NULL,
  user_id                     uuid NOT NULL UNIQUE REFERENCES sigat.users (id)
    ON DELETE RESTRICT,
  document_number             varchar(64) NOT NULL,
  full_name                   varchar(320) NOT NULL,
  contact_email               varchar(320) NOT NULL,
  mobile_phone                varchar(64),
  status                      varchar(32)  NOT NULL DEFAULT 'ACTIVE',
  position_type_master_id     uuid NOT NULL REFERENCES sigat.masters (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  employment_type_master_id   uuid NOT NULL REFERENCES sigat.masters (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  contract_date               date,
  metadata                    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS responsible_persons_doc_uidx
  ON sigat.responsible_persons (tenant_id, upper(trim(document_number::text)));

CREATE INDEX IF NOT EXISTS responsible_persons_tenant_idx ON sigat.responsible_persons (tenant_id);
CREATE INDEX IF NOT EXISTS responsible_persons_user_idx ON sigat.responsible_persons (user_id);
CREATE INDEX IF NOT EXISTS responsible_persons_position_type_idx
  ON sigat.responsible_persons (position_type_master_id);
CREATE INDEX IF NOT EXISTS responsible_persons_employment_type_idx
  ON sigat.responsible_persons (employment_type_master_id);

COMMENT ON COLUMN sigat.responsible_persons.metadata IS
  'Free-form JSON; organizational unit links live in responsible_person_unit_roles.';

-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sigat.responsible_person_unit_roles (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 uuid NOT NULL,
  responsible_person_id   uuid NOT NULL REFERENCES sigat.responsible_persons (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  master_id                 uuid NOT NULL REFERENCES sigat.masters (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  unit_role_master_id       uuid NOT NULL REFERENCES sigat.masters (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT responsible_person_unit_roles_uniq UNIQUE (responsible_person_id, master_id)
);

CREATE INDEX IF NOT EXISTS responsible_person_unit_roles_tenant_idx
  ON sigat.responsible_person_unit_roles (tenant_id);
CREATE INDEX IF NOT EXISTS responsible_person_unit_roles_master_idx
  ON sigat.responsible_person_unit_roles (master_id);

-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sigat.responsible_persons_validate_masters()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM sigat.masters m
    WHERE m.id = NEW.position_type_master_id AND m.tenant_id = NEW.tenant_id AND m.type = 'RESP_POSITION_TYPE'
  ) THEN
    RAISE EXCEPTION 'responsible_persons: position_type_master_id must reference masters.type = RESP_POSITION_TYPE for same tenant';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM sigat.masters m
    WHERE m.id = NEW.employment_type_master_id AND m.tenant_id = NEW.tenant_id AND m.type = 'RESP_EMPLOYMENT_TYPE'
  ) THEN
    RAISE EXCEPTION 'responsible_persons: employment_type_master_id must reference masters.type = RESP_EMPLOYMENT_TYPE for same tenant';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM sigat.users u
    WHERE u.id = NEW.user_id AND u.tenant_id = NEW.tenant_id
  ) THEN
    RAISE EXCEPTION 'responsible_persons: user_id must exist in sigat.users with same tenant_id';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_responsible_persons_validate ON sigat.responsible_persons;

CREATE TRIGGER trg_responsible_persons_validate
  BEFORE INSERT OR UPDATE OF tenant_id, user_id, position_type_master_id, employment_type_master_id
  ON sigat.responsible_persons
  FOR EACH ROW
  EXECUTE PROCEDURE sigat.responsible_persons_validate_masters();

CREATE OR REPLACE FUNCTION sigat.responsible_person_unit_roles_validate()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  r_tenant uuid;
BEGIN
  SELECT r.tenant_id INTO r_tenant FROM sigat.responsible_persons r WHERE r.id = NEW.responsible_person_id;
  IF r_tenant IS NULL THEN
    RAISE EXCEPTION 'responsible_person_unit_roles: responsible_person_id does not exist';
  END IF;
  IF NEW.tenant_id IS DISTINCT FROM r_tenant THEN
    RAISE EXCEPTION 'responsible_person_unit_roles: tenant_id must match responsible person tenant';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM sigat.masters m
    WHERE m.id = NEW.master_id AND m.tenant_id = NEW.tenant_id AND m.type = 'UND_ORGANIZACIONAL'
  ) THEN
    RAISE EXCEPTION 'responsible_person_unit_roles: master_id must be UND_ORGANIZACIONAL for same tenant';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM sigat.masters m
    WHERE m.id = NEW.unit_role_master_id AND m.tenant_id = NEW.tenant_id AND m.type = 'RESP_UNIT_ROLE'
  ) THEN
    RAISE EXCEPTION 'responsible_person_unit_roles: unit_role_master_id must reference masters.type = RESP_UNIT_ROLE';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_responsible_person_unit_roles_validate ON sigat.responsible_person_unit_roles;

CREATE TRIGGER trg_responsible_person_unit_roles_validate
  BEFORE INSERT OR UPDATE OF tenant_id, responsible_person_id, master_id, unit_role_master_id
  ON sigat.responsible_person_unit_roles
  FOR EACH ROW
  EXECUTE PROCEDURE sigat.responsible_person_unit_roles_validate();

CREATE OR REPLACE FUNCTION sigat.sigat_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_responsible_persons_updated ON sigat.responsible_persons;
CREATE TRIGGER trg_responsible_persons_updated
  BEFORE UPDATE ON sigat.responsible_persons
  FOR EACH ROW
  EXECUTE PROCEDURE sigat.sigat_touch_updated_at();
