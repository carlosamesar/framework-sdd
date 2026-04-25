-- ============================================================================
-- One-shot: drop redundant sigat.app_users; FK responsible_persons -> sigat.users
-- Run when sigat.users already exists (canonical auth) and app_users is empty
-- or rows were merged into users beforehand (same UUIDs as user_id).
-- Safe sections use IF EXISTS / dynamic constraint names.
-- ============================================================================

DROP TRIGGER IF EXISTS trg_responsible_persons_delete_user ON sigat.responsible_persons;
DROP FUNCTION IF EXISTS sigat.responsible_persons_delete_user();

DO $$
BEGIN
  IF to_regclass('sigat.app_users') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_app_users_updated ON sigat.app_users;
  END IF;
END $$;

DO $$
DECLARE
  r record;
BEGIN
  IF to_regclass('sigat.responsible_persons') IS NULL OR to_regclass('sigat.users') IS NULL THEN
    RAISE NOTICE 'migrate_drop_app_users: skip (responsible_persons or users missing)';
    RETURN;
  END IF;

  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class rel ON rel.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace
    JOIN pg_class ref ON ref.oid = c.confrelid
    JOIN pg_namespace rn ON rn.oid = ref.relnamespace
    WHERE n.nspname = 'sigat'
      AND rel.relname = 'responsible_persons'
      AND c.contype = 'f'
      AND rn.nspname = 'sigat'
      AND ref.relname = 'app_users'
  LOOP
    EXECUTE format('ALTER TABLE sigat.responsible_persons DROP CONSTRAINT %I', r.conname);
  END LOOP;

  BEGIN
    ALTER TABLE sigat.responsible_persons
      ADD CONSTRAINT responsible_persons_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES sigat.users (id) ON DELETE RESTRICT;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;

DROP TABLE IF EXISTS sigat.app_users;

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
