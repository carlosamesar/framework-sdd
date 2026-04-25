-- ============================================================================
-- SIGAT: contracts (organizational unit via masters)
-- ============================================================================
-- master_id -> sigat.masters.id (UND_ORGANIZACIONAL).
-- extra_attributes: free-form JSON (annexes, etc.)
-- validation_jsonlogic: JSON-Logic (https://jsonlogic.com/) evaluated in app.
-- ============================================================================

CREATE TABLE IF NOT EXISTS sigat.contracts (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              uuid NOT NULL,
  master_id              uuid NOT NULL,
  contract_number        varchar(128) NOT NULL,
  contract_object        text NOT NULL,
  effective_start_date   date NOT NULL,
  effective_end_date     date NOT NULL,
  extra_attributes       jsonb NOT NULL DEFAULT '{}'::jsonb,
  validation_jsonlogic   jsonb,
  is_active              boolean NOT NULL DEFAULT true,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT contracts_dates_chk
    CHECK (effective_end_date >= effective_start_date),

  CONSTRAINT contracts_master_fk
    FOREIGN KEY (master_id) REFERENCES sigat.masters (id)
      ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS contracts_tenant_contract_number_uidx
  ON sigat.contracts (tenant_id, lower(contract_number))
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS contracts_tenant_master_idx
  ON sigat.contracts (tenant_id, master_id);

CREATE INDEX IF NOT EXISTS contracts_effective_dates_idx
  ON sigat.contracts (tenant_id, effective_start_date, effective_end_date);

COMMENT ON TABLE sigat.contracts IS
  'Department/organizational contracts; master_id -> masters (UND_ORGANIZACIONAL).';

COMMENT ON COLUMN sigat.contracts.extra_attributes IS
  'Free-form JSON for complementary contract data.';

COMMENT ON COLUMN sigat.contracts.validation_jsonlogic IS
  'JSON-Logic document for app-side validation (e.g. effective dates).';

CREATE OR REPLACE FUNCTION sigat.contracts_validate_master()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM sigat.masters m
    WHERE m.id = NEW.master_id
      AND m.tenant_id = NEW.tenant_id
      AND m.type = 'UND_ORGANIZACIONAL'
  ) THEN
    RAISE EXCEPTION
      'contracts: master_id must reference sigat.masters for same tenant_id with type = UND_ORGANIZACIONAL';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_contracts_validate_master ON sigat.contracts;

CREATE TRIGGER trg_contracts_validate_master
  BEFORE INSERT OR UPDATE OF tenant_id, master_id
  ON sigat.contracts
  FOR EACH ROW
  EXECUTE PROCEDURE sigat.contracts_validate_master();

CREATE OR REPLACE FUNCTION sigat.contracts_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_contracts_updated_at ON sigat.contracts;

CREATE TRIGGER trg_contracts_updated_at
  BEFORE UPDATE ON sigat.contracts
  FOR EACH ROW
  EXECUTE PROCEDURE sigat.contracts_touch_updated_at();
